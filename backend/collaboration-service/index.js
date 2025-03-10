import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import collaborationRoutes from "./src/routes/collaborationRoutes.js";
import Document from "./src/models/document.js";
import connectDB from "./config/db.js";
dotenv.config();
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(
    cors({
      origin: ["http://localhost:5173", "http://localhost:3000"],
      credentials: true,
    })
  );
app.use(express.json());
connectDB();

app.use("/api/collaboration", collaborationRoutes);

io.on("connection", (socket) => {
  console.log("User connected to collaboration: ", socket.id);

  socket.on("join-document", async (documentId) => {
    socket.join(documentId);

    let document = await Document.findById(documentId);
    if (!document) {
      document = await Document.create({
        _id: documentId,
        content: "",
        history: [],
      });
    }

    socket.emit("load-document", {
      content: document.content,
      version: document.lastUpdated,
    });
    console.log(`User joined document ${documentId}`);
  });

  socket.on("edit-document", async ({ documentId, content }) => {
    console.log("Received content update:", content);

    try {
      // Fetch the document from the database
      let document = await Document.findById({ _id: documentId });

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

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Start Server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () =>
  console.log(`Collaboration Service running on port ${PORT}`)
);
