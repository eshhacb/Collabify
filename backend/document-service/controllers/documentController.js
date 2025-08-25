import Document from "../models/Document.model.js";
import UserDocument from "../models/UserDocument.js";
import { v4 as uuidv4 } from "uuid"; // Import UUID Generator
import axios from "axios";
import dotenv from "dotenv";
import sequelize from "../config/db.js"; // Sequelize instance for transactions

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

export const getAllDocuments = async (req, res) => {
  try {
    const documents = await Document.findAll();
    res.json({ documents });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving documents", error });
  }
};