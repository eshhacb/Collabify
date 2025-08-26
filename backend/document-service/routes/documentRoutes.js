import express from "express";
import {
  createDocument,
  getAllDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  addCollaborator,
  updateCollaboratorRole,
  removeCollaborator,
  sendInvitation,
  getInvitations,
  cancelInvitation,
} from "../controllers/documentController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

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
  "/invitations/:invitationId",
  authenticateToken,
  authorizeRoles("admin", "editor"),
  cancelInvitation
);

export default router;