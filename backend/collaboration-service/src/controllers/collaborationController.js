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
