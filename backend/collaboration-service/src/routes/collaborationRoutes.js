import express from "express";
import { getDocument, saveDocument ,createDocument} from "../controllers/collaborationController.js";

const router = express.Router();
router.post("/create-doc",createDocument);
router.get("/:id", getDocument);
router.post("/:id", saveDocument);

export default router;
