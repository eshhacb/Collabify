import Document from "../models/Document.model.js";
import UserDocument from "../models/UserDocument.js";
import { v4 as uuidv4 } from "uuid";
import axios from "axios"
import dotenv from "dotenv"

dotenv.config();
export const createDocument = async (req, res) => {
  try {
    const { title } = req.body;
    const userId = req.user.userId;

    // 🔹 Create a new document in PostgreSQL
    const document = await Document.create({ title });

    if (!document.id) {
      throw new Error("Failed to retrieve document ID after creation");
    }

    // 🔹 Assign Admin role to the document creator
    await UserDocument.create({
      userId,
      documentId: document.id, // Ensure ID exists
      role: "admin",
    });

    // 🔹 Send document ID to MongoDB Collaboration Service
    
    await axios.post(`${process.env.COLLAB_SERVICE_URL}/create-MongoDocument`, {
      documentId: document.id,
    });

    res.status(201).json({
      message: "Document created successfully",
      document,
    });
  } catch (error) {
    console.error("❌ Error creating document:", error);
    res.status(500).json({
      message: "Error creating document",
      error: error.message,
    });
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
