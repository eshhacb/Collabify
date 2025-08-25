import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import collaborationRoutes from "./src/routes/collaborationRoutes.js";
import Document from "./src/models/document.js";
import { transformOperation } from "./src/utils/transformOperations.js"; // OT Transformation

dotenv.config();
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  })
);
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => {
    console.error("DB Connection Error:", err);
    console.error("Please check:");
    console.error("1. Your internet connection");
    console.error("2. MongoDB Atlas cluster is running");
    console.error("3. Your IP is whitelisted in MongoDB Atlas");
    console.error("4. Connection string is correct");
    process.exit(1);
  });

app.use("/api/collaboration", collaborationRoutes);

// WebSocket Namespace for Collaboration
const collaborationNamespace = io.of("/collaboration");

// collaborationNamespace.on("connection", (socket) => {
io.on("connection", (socket) => {
  console.log("User connected to collaboration: ", socket.id);

  socket.on("join-document", async (documentId) => {
    socket.join(documentId);

    let document = await Document.findById(documentId);
    if (!document) {
      document = await Document.findOneAndUpdate(
        { _id: documentId },
        { $setOnInsert: { doc_id: documentId, content: "" } },
        { upsert: true, new: true }
      );
    }

    socket.emit("load-document", { content: document.content, updated_at: document.updated_at });
    console.log(`User joined document ${documentId}`);
  });


  socket.on("edit-document", async ({ documentId, content }) => {
    console.log("BAckend Received content update:", content);
  
    try {
      // Fetch the document from the database
      let document = await Document.findById(documentId);
  
      if (!document) {
        console.log("Document not found:", documentId);
        return;
      }
  
      console.log("Current document content:", document.content);
  
      // Broadcast the updated content to all users in the same document room
      socket.to(documentId).emit("document-updated", content);
      
      // Update document content
      document.content = content;
      // Save the updated document back to the database
      await document.save();
      console.log("Document updated successfully");
  
  
    } catch (error) {
      console.error("Error updating document:", error);
    }
  });



  //undo will use OT so not implemented yet 
socket.on("undo", async ({ documentId }) => {
  let document = await Document.findById(documentId);
  if (!document || document.history.length === 0) return;

  // Get last operation and reverse it
  const lastOp = document.history.pop();
  const reversedOp = reverseOperation(lastOp);

  //  Apply the reversed operation
  document.content = applyOperation(document.content, reversedOp);
  document.lastUpdated = new Date();
  await document.save();

  //  Broadcast updated content
  collaborationNamespace.to(documentId).emit("document-updated", {
    content: document.content,
    version: document.lastUpdated,
  });
});

socket.on("disconnect", () => {
  console.log("User disconnected:", socket.id);
});
});

//  Function to Apply Operations (Insert/Delete)
function applyOperation(content, operation) {
  if (operation.type === "insert") {
    return content.slice(0, operation.index) + operation.text + content.slice(operation.index);
  }
  if (operation.type === "delete") {
    return content.slice(0, operation.index) + content.slice(operation.index + operation.length);
  }
  return content;
}

//  Function to Reverse Operations for Undo
function reverseOperation(operation) {
  if (operation.type === "insert") {
    return { type: "delete", index: operation.index, length: operation.text.length };
  }
  if (operation.type === "delete") {
    return { type: "insert", index: operation.index, text: operation.text };
  }
  return operation;
}

// Start Server
const PORT = process.env.PORT || 5003;
server.listen(PORT, () => console.log(`Collaboration Service running on port ${PORT}`));