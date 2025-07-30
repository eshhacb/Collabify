import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import aiRoutes from "./routes/aiRoutes.js"; // Import AI Routes

dotenv.config();
const app = express();
app.use(express.json());
app.use(
    cors({
      origin: ["http://localhost:5173", "http://localhost:3000"],
      credentials: true,
    })
  );

// Use AI Routes
app.use("/api", aiRoutes);

// Start AI Service
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`AI Suggestion Service running on port ${PORT}`));
