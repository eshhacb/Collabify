import express from "express";
import { getDocument, saveDocument ,createDocument} from "../controllers/collaborationController.js";

const router = express.Router();

router.get("/:id", getDocument);
router.post("/:id", saveDocument);
router.post("/create-doc",createDocument)
export default router;
