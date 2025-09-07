import express from "express";
import {
  createDocument,
  getAllDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  listCollaborators,
  addCollaborator,
  updateCollaboratorRole,
  removeCollaborator,
  sendInvitation,
  getInvitations,
  cancelInvitation,
  acceptInvitationMembership,
} from "../controllers/documentController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import taskRoutes from "./taskRoutes.js";

const router = express.Router();

// Existing endpoints
router.get("/get-Alldocument", authenticateToken, getAllDocuments);
router.post("/create-document", authenticateToken, createDocument);

// RBAC-protected document endpoints
router.get(
  "/:documentId",
  authenticateToken,
  authorizeRoles("viewer", "editor", "admin"),
  getDocumentById
);

router.put(
  "/:documentId",
  authenticateToken,
  authorizeRoles("editor", "admin"),
  updateDocument
);

router.delete(
  "/:documentId",
  authenticateToken,
  authorizeRoles("admin"),
  deleteDocument
);

// Collaborators
router.get(
  "/:documentId/collaborators",
  authenticateToken,
  authorizeRoles("viewer", "editor", "admin"),
  listCollaborators
);

// Collaborator management (admin only)
router.post(
  "/:documentId/collaborators",
  authenticateToken,
  authorizeRoles("admin"),
  addCollaborator
);

router.patch(
  "/:documentId/collaborators/:userId",
  authenticateToken,
  authorizeRoles("admin"),
  updateCollaboratorRole
);

router.delete(
  "/:documentId/collaborators/:userId",
  authenticateToken,
  authorizeRoles("admin"),
  removeCollaborator
);

// Invitation management (admin/editor)
router.post(
  "/:documentId/invitations",
  authenticateToken,
  authorizeRoles("admin", "editor"),
  sendInvitation
);

router.get(
  "/:documentId/invitations",
  authenticateToken,
  authorizeRoles("admin", "editor"),
  getInvitations
);

router.delete(
  "/:documentId/invitations/:invitationId",
  authenticateToken,
  authorizeRoles("admin", "editor"),
  cancelInvitation
);

// Internal service endpoint for adding membership after invitation acceptance
router.post(
  "/internal/invitations/accept",
  acceptInvitationMembership
);

// Mount task routes under documents
router.use("/", taskRoutes);

export default router;