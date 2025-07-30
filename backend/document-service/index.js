import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import documentRoutes from "./routes/documentRoutes.js";
import sequelize from "./config/db.js";
import cookieParser from "cookie-parser";
dotenv.config();
const app = express();

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); 
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  })
);
// ✅ API Routes
app.use("/api/documents", documentRoutes);

// ✅ Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, async () => {
  console.log(`🚀 Document Service running on port ${PORT}`);
  
})
//   try {
//     await sequelize.authenticate();
//     console.log("✅ Database connected successfully.");
//   } catch (error) {
//     console.error("❌ Database connection error:", error);
//   }
// });