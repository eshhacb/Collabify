import express from "express";
import { createDocument,getAllDocuments } from "../controllers/documentController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

//  Corrected: No documentId in URL for creating a new document
router.get("/get-Alldocument", authenticateToken, getAllDocuments);
router.post("/create-document", authenticateToken, createDocument);

export default router;
