import Document from "../models/document.js";

export const getDocument = async (req, res) => {
  const { id } = req.params;
  let document = await Document.findById(id);

  if (!document) {
    document = await Document.findOneAndUpdate(
      { _id: id },
      { $setOnInsert: { doc_id: id, content: "" } },
      { upsert: true, new: true }
    );
  }

  res.json({ content: document.content, updated_at: document.updated_at });
};

export const saveDocument = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  let document = await Document.findById(id);
  if (!document) {
    return res.status(404).json({ error: "Document not found" });
  }

  document.content = content;
  await document.save();

  res.json({ message: "Document saved successfully", updated_at: document.updated_at });
};
