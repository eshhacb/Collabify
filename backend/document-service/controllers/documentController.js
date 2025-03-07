import Document from "../models/Document.model.js";
import UserDocument from "../models/UserDocument.js";
import { v4 as uuidv4 } from "uuid";

export const createDocument = async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.user.userId;

    const document = await Document.create({ title, content });

    await UserDocument.create({
      userId,
      documentId: document.id,
      role: "admin",
    });

    res
      .status(201)
      .json({ message: "Document created successfully", document });
  } catch (error) {
    console.error(" Error creating document:", error);
    res
      .status(500)
      .json({ message: "Error creating document", error: error.message });
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
