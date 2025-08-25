import Document from "../models/Document.model.js";
import UserDocument from "../models/UserDocument.js";
import { v4 as uuidv4 } from "uuid"; // Import UUID Generator
import { Sequelize } from "sequelize"; // Import Sequelize for UUID conversion
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export const createDocument = async (req, res) => {
  try {
    const { title } = req.body;
    const userId = req.user.userId; // comes from auth service token

    // Generate a UUID as a string
    const documentId = uuidv4();

    // Create a new document in PostgreSQL with owner
    const document = await Document.create({
      id: documentId,
      title,
      ownerId: userId,
    });

    if (!document || !document.id) {
      throw new Error("Document ID is undefined after creation.");
    }

    // Assign Admin role to the document creator
    await UserDocument.create({
      userId,
      documentId: document.id,
      role: "admin",
      invitedBy: null,
    });

    // Inform Collaboration Service (optional; service can lazily create)
    try {
      await axios.post(`http://localhost:8000/api/collaboration/${document.id}`, {
        content: "",
      });
    } catch {}

    res.status(201).json({ message: "Document created successfully", document });
  } catch (error) {
    res.status(500).json({ message: "Error creating document", error: error.message });
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