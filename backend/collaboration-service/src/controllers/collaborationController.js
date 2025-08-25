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

  try {
    // Upsert the document: create if not exists, otherwise update content
    const document = await Document.findOneAndUpdate(
      { _id: id },
      { $set: { content }, $setOnInsert: { doc_id: id } },
      { upsert: true, new: true }
    );

    return res.json({ message: "Document saved successfully", updated_at: document.updated_at });
  } catch (err) {
    return res.status(500).json({ error: "Failed to save document", details: err.message });
  }
};
