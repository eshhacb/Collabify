import Document from "../models/document.js";

export const getDocument = async (req, res) => {
  const { id } = req.params;
  let document = await Document.findById(id);

  if (!document) {
    document = await Document.create({ _id: id, content: "", history: [] });
  }

  res.json({ content: document.content, version: document.lastUpdated });
};

export const saveDocument = async (req, res) => {
  const { id } = req.params;
  const { content, operation } = req.body;

  let document = await Document.findById(id);
  if (!document) {
    return res.status(404).json({ error: "Document not found" });
  }

  if (operation) {
    document.history.push(operation); // Store operation for undo
  }

  document.content = content;
  document.lastUpdated = new Date();
  await document.save(); //saves in the mongodb db

  res.json({ message: "Document saved successfully" });
};


export const createDocument = async (req, res) => {
  try {
    const { documentId } = req.body; // ✅ Receive `documentId` from `document-service`
    console.log(documentId)

    if (!documentId) {
      return res.status(400).json({ message: "Document ID is required" });
    }

    // ✅ Check if document already exists
    let document = await Document.findById(documentId);
    if (document) {
      return res.status(409).json({ message: "Document already exists", document });
    }

    // ✅ Create a new document in MongoDB
    document = new Document.create({
      _id: documentId,
      content: "", // Empty content initially
      history: [],
      lastUpdated: Date.now(),
    });
    await document.save();

    res.status(201).json({ message: "Document created in MongoDB", document });
  } catch (error) {
    console.error("❌ Error creating document in MongoDB:", error);
    res.status(500).json({ message: "Error creating document", error: error.message });
  }
};