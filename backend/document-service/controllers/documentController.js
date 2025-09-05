import Document from "../models/Document.model.js";
import UserDocument from "../models/UserDocument.js";
import { v4 as uuidv4 } from "uuid"; // Import UUID Generator
import axios from "axios";
import dotenv from "dotenv";
import sequelize from "../config/db.js"; // Sequelize instance for transactions
import { sendDocumentInvitation, getDocumentInvitations, cancelDocumentInvitation } from "../utils/invitationService.js";

dotenv.config();

export const createDocument = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { title } = req.body;
    const userId = req.user.userId; // comes from auth service token

    // 1) Generate deterministic ID so we can reference it across services
    const documentId = uuidv4();

    // 2) Create Document in Postgres (ACID - within transaction)
    const document = await Document.create(
      {
        id: documentId,
        title,
        ownerId: userId,
      },
      { transaction: t }
    );

    if (!document || !document.id) {
      throw new Error("Document ID is undefined after creation.");
    }

    // 3) Create UserDocument (role assignment) in the same transaction
    await UserDocument.create(
      {
        userId,
        documentId: document.id,
        role: "admin",
        invitedBy: null,
      },
      { transaction: t }
    );

    // Commit Postgres work first
    await t.commit();

    // 4) Create corresponding MongoDB doc via Collaboration Service
    // Uses upsert behavior on the collaboration service so it's idempotent
    const collabBase = process.env.COLLABORATION_SERVICE_URL || "http://localhost:5003";
    try {
      await axios.post(`${collabBase}/api/collaboration/${document.id}`, { content: "" }, { timeout: 8000 });
    } catch (mongoErr) {
      // Retry once on alternate default port (8000 <-> 5003)
      const altBase = collabBase.includes(":8000") ? "http://localhost:5003" : "http://localhost:8000";
      try {
        await axios.post(`${altBase}/api/collaboration/${document.id}`, { content: "" }, { timeout: 8000 });
      } catch (mongoErr2) {
        // Compensating action: remove Postgres rows to keep system consistent if Mongo creation fails
        try {
          await sequelize.transaction(async (t2) => {
            await UserDocument.destroy({ where: { documentId: document.id }, transaction: t2 });
            await Document.destroy({ where: { id: document.id }, transaction: t2 });
          });
        } catch (cleanupErr) {
          // If cleanup fails, surface detailed error for observability
          return res.status(500).json({
            message: "Mongo creation failed (both base and fallback) and cleanup also failed",
            error: mongoErr2.message,
            firstError: mongoErr.message,
            cleanupError: cleanupErr.message,
          });
        }

        return res.status(502).json({
          message: "Failed to create collaboration document on both base and fallback; rolled back Postgres records",
          error: mongoErr2.message,
          firstError: mongoErr.message,
        });
      }
    }

    // Success
    return res.status(201).json({ message: "Document created successfully", document });
  } catch (error) {
    // Rollback Postgres if we haven't committed
    try {
      if (!t.finished) await t.rollback();
    } catch {}

    return res.status(500).json({ message: "Error creating document", error: error.message });
  }
};

// RBAC-aware: return only documents current user has any role on and include that role
export const getAllDocuments = async (req, res) => {
  try {
    const userId = req.user.userId;

    const documents = await Document.findAll({
      include: [
        {
          model: UserDocument,
          where: { userId },
          attributes: ["role"], // include the user's role on this document
        },
      ],
      order: [["created_at", "DESC"]],
    });

    // Flatten user's role for convenience
    const result = documents.map((doc) => {
      const json = doc.toJSON();
      const role = json.UserDocuments?.[0]?.role || json.UserDocument?.role || null;
      const isOwner = json.ownerId === userId;
      delete json.UserDocuments;
      delete json.UserDocument;
      return { ...json, userRole: role, isOwner };
    });

    return res.json({ documents: result });
  } catch (error) {
    return res.status(500).json({ message: "Error retrieving documents", error: error.message });
  }
};

// GET single document (viewer/editor/admin) – include current user's role
export const getDocumentById = async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user.userId;

    const document = await Document.findByPk(documentId);
    if (!document) return res.status(404).json({ message: "Document not found" });

    const membership = await UserDocument.findOne({ where: { documentId, userId } });
    const userRole = membership?.role || null;

    return res.json({ document, userRole });
  } catch (error) {
    return res.status(500).json({ message: "Error retrieving document", error: error.message });
  }
};

// UPDATE document metadata (editor/admin)
export const updateDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { title } = req.body;

    if (!title || typeof title !== "string") {
      return res.status(400).json({ message: "Invalid payload: 'title' is required" });
    }

    const document = await Document.findByPk(documentId);
    if (!document) return res.status(404).json({ message: "Document not found" });

    document.title = title;
    await document.save();
    return res.json({ message: "Document updated", document });
  } catch (error) {
    return res.status(500).json({ message: "Error updating document", error: error.message });
  }
};

// DELETE document (admin)
export const deleteDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    const deleted = await Document.destroy({ where: { id: documentId } });
    if (!deleted) return res.status(404).json({ message: "Document not found" });

    // Note: UserDocument rows cascade via model definition
    return res.json({ message: "Document deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting document", error: error.message });
  }
};

const VALID_ROLES = ["viewer", "editor", "admin"];

// ADD collaborator (admin)
export const addCollaborator = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { userId: targetUserId, role } = req.body;
    const inviterId = req.user.userId;

    if (!targetUserId || !role) {
      return res.status(400).json({ message: "'userId' and 'role' are required" });
    }
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ message: `Invalid role. Allowed: ${VALID_ROLES.join(", ")}` });
    }

    const existing = await UserDocument.findOne({ where: { userId: targetUserId, documentId } });
    if (existing) {
      return res.status(409).json({ message: "User already a collaborator on this document" });
    }

    const created = await UserDocument.create({
      userId: targetUserId,
      documentId,
      role,
      invitedBy: inviterId,
    });

    return res.status(201).json({ message: "Collaborator added", collaborator: created });
  } catch (error) {
    return res.status(500).json({ message: "Error adding collaborator", error: error.message });
  }
};

// UPDATE collaborator role (admin)
export const updateCollaboratorRole = async (req, res) => {
  try {
    const { documentId, userId } = req.params; // userId of the collaborator to update
    const { role } = req.body;

    if (!role || !VALID_ROLES.includes(role)) {
      return res.status(400).json({ message: `Invalid role. Allowed: ${VALID_ROLES.join(", ")}` });
    }

    const userDoc = await UserDocument.findOne({ where: { documentId, userId } });
    if (!userDoc) return res.status(404).json({ message: "Collaborator not found for this document" });

    // Prevent demoting the last admin
    if (userDoc.role === "admin" && role !== "admin") {
      const adminCount = await UserDocument.count({ where: { documentId, role: "admin" } });
      if (adminCount <= 1) {
        return res.status(400).json({ message: "Cannot demote the last admin of the document" });
      }
    }

    userDoc.role = role;
    await userDoc.save();
    return res.json({ message: "Collaborator role updated", collaborator: userDoc });
  } catch (error) {
    return res.status(500).json({ message: "Error updating collaborator role", error: error.message });
  }
};

// REMOVE collaborator (admin)
export const removeCollaborator = async (req, res) => {
  try {
    const { documentId, userId } = req.params; // userId of the collaborator to remove

    const userDoc = await UserDocument.findOne({ where: { documentId, userId } });
    if (!userDoc) return res.status(404).json({ message: "Collaborator not found for this document" });

    // Prevent removing the last admin
    if (userDoc.role === "admin") {
      const adminCount = await UserDocument.count({ where: { documentId, role: "admin" } });
      if (adminCount <= 1) {
        return res.status(400).json({ message: "Cannot remove the last admin of the document" });
      }
    }

    await userDoc.destroy();
    return res.json({ message: "Collaborator removed" });
  } catch (error) {
    return res.status(500).json({ message: "Error removing collaborator", error: error.message });
  }
};

// SEND invitation (admin/editor)
export const sendInvitation = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { email, role } = req.body;
    const inviterId = req.user.userId;

    // Validate role
    if (!['viewer', 'editor'].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Allowed roles: viewer, editor" });
    }

    // Get document details
    const document = await Document.findByPk(documentId);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Get inviter's name (you might want to get this from auth service)
    const inviterName = req.user.name || req.user.email || req.user.userId || 'Unknown User';

    // Send invitation via notification service
    const invitationData = {
      email,
      documentId,
      documentTitle: document.title,
      role,
      invitedBy: inviterId,
      invitedByName: inviterName
    };

    const result = await sendDocumentInvitation(invitationData);

    return res.status(201).json({
      message: "Invitation sent successfully",
      invitation: result.invitation
    });

  } catch (error) {
    return res.status(500).json({ 
      message: "Error sending invitation", 
      error: error.message 
    });
  }
};

// GET invitations for document (admin/editor)
export const getInvitations = async (req, res) => {
  try {
    const { documentId } = req.params;

    const result = await getDocumentInvitations(documentId);

    return res.json({
      invitations: result.invitations
    });

  } catch (error) {
    return res.status(500).json({ 
      message: "Error getting invitations", 
      error: error.message 
    });
  }
};

// CANCEL invitation (admin/editor)
export const cancelInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;

    await cancelDocumentInvitation(invitationId);

    return res.json({ message: "Invitation cancelled successfully" });

  } catch (error) {
    return res.status(500).json({ 
      message: "Error cancelling invitation", 
      error: error.message 
    });
  }
};

// INTERNAL: Accept invitation and add membership (called by auth-service)
export const acceptInvitationMembership = async (req, res) => {
  try {
    const serviceSecret = process.env.SERVICE_SECRET || "";
    if ((req.headers["x-service-secret"] || "") !== serviceSecret) {
      return res.status(401).json({ message: "Unauthorized service request" });
    }

    const { documentId, userId, role } = req.body;
    if (!documentId || !userId || !role) {
      return res.status(400).json({ message: "'documentId', 'userId', and 'role' are required" });
    }
    if (!['viewer', 'editor', 'admin'].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const document = await Document.findByPk(documentId);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    const existing = await UserDocument.findOne({ where: { userId, documentId } });
    if (existing) {
      // Upgrade role if incoming role has higher privileges
      const rank = { viewer: 0, editor: 1, admin: 2 };
      if ((rank[role] ?? -1) > (rank[existing.role] ?? -1)) {
        existing.role = role;
        await existing.save();
        return res.json({ message: "Collaborator role upgraded", collaborator: existing });
      }
      return res.json({ message: "User already a collaborator", collaborator: existing });
    }

    const created = await UserDocument.create({ userId, documentId, role, invitedBy: null });
    return res.status(201).json({ message: "Membership added", collaborator: created });
  } catch (error) {
    return res.status(500).json({ message: "Error accepting invitation membership", error: error.message });
  }
};