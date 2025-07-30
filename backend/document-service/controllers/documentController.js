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
    const userId = req.user.userId;

    // ✅ Generate a UUID as a string
    const documentId = uuidv4();
    console.log("Generated Document ID:", documentId);

    // ✅ Convert UUID string to Sequelize UUID format
    // const formattedDocumentId = Sequelize.UUIDV4;

    // ✅ Create a new document in PostgreSQL (Sequelize will accept UUID)
    const document = await Document.create({
      id: documentId, // Use manually generated UUID
      title,
    });

    // ✅ Ensure the document was created successfully
    if (!document || !document.id) {
      throw new Error("❌ Document ID is undefined after creation.");
    }

    console.log("✅ Document Created:", document);

    // ✅ Assign Admin role to the document creator
    const userDoc = await UserDocument.create({
      userId,
      documentId: document.id, // Use UUID
      role: "admin",
    });

    console.log("✅ UserDocument Created:", userDoc);

    // ✅ Send document ID to MongoDB Collaboration Service
    console.log(process.env.COLLAB_SERVICE_URL)
    console.log(document.id)
   
    await axios.post(`http://localhost:8000/api/collaboration/create-MongoDocument`, {
      documentId: document.id.toString(),
    });

    res.status(201).json({
      message: "Document created successfully",
      document,
    });
  } catch (error) {
    
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