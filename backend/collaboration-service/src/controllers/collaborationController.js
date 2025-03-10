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
    const { documentId } = req.body;

    if (!documentId) {
      return res.status(400).json({ error: "❌ Missing documentId in request body" });
    }

    // ✅ Check if document already exists
    const existingDocument = await Document.findById(documentId);
    if (existingDocument) {
      return res.status(200).json({
        message: "⚠️ Document already exists in MongoDB",
        document: existingDocument,
      });
    }

    // ✅ Fix the .create() usage (Remove `new`)
    const newDocument = await Document.create({
      _id: documentId, // Store as MongoDB _id
      content: "",
      lastUpdated: new Date(),
    });

    console.log("✅ Document created in MongoDB:", newDocument);

    res.status(201).json({
      message: "📄 Document created successfully in MongoDB",
      document: newDocument,
    });
  } catch (error) {
    console.error("❌ Error saving document in MongoDB:", error);
    res.status(500).json({
      error: "❌ Error creating document in MongoDB",
      details: error.message,
    });
  }
};
