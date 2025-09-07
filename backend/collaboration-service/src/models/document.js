import mongoose from "mongoose";

// MongoDB: collaborative document content
// Fields: id (_id) | doc_id | content | code | updated_at
const documentSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // same as Postgres document.id (UUID)
    doc_id: { type: String, required: true, index: true }, // duplicate for explicit field as requested
    content: { type: String, default: "" },
    code: { type: String, default: "" }, // optional code editor content per document
  },
  { timestamps: { createdAt: false, updatedAt: "updated_at" } }
);

export default mongoose.model("Document", documentSchema);
