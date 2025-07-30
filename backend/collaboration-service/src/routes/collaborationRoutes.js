import express from "express";
import { getDocument, saveDocument } from "../controllers/collaborationController.js";

const router = express.Router();

router.get("/:id", getDocument);
router.post("/:id", saveDocument);

export default router;
