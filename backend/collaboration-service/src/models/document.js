import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    _id: {
      type: String, // ✅ Ensure it's a string (UUID from PostgreSQL)
      required: true,
    },
    content: {
      type: String,
      default: "",
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "documents", // ✅ Explicitly set collection name
  }
);

export default mongoose.model("Document", documentSchema);
