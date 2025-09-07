import express from "express";
import { getDocument, saveDocument, saveCode } from "../controllers/collaborationController.js";

const router = express.Router();

router.get("/:id", getDocument);
router.post("/:id", saveDocument);
router.post("/:id/code", saveCode);

export default router;
