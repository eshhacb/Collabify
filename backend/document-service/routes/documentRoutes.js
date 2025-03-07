import express from "express";
import { createDocument } from "../controllers/documentController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Corrected: No `documentId` in URL for creating a new document
router.post("/create-document", authenticateToken, createDocument);

export default router;
