import express from "express";
import proxy from "express-http-proxy";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
app.use(express.json());

// ✅ CORS Configuration
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"], // Allow frontend origins
    credentials: true, // Allow cookies/auth headers
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
  })
);

// ✅ Proxy to Auth Service
app.use(
  "/api/auth",
  proxy(process.env.AUTH_SERVICE_URL, {
    proxyReqPathResolver: (req) => `/api/auth${req.url}`,
    proxyErrorHandler: (err, res, next) => {
      res.status(500).json({ error: "API Gateway Proxy Error (Auth Service)" });
    },
  })
);

// ✅ Proxy to Document Service
app.use(
  "/api/documents",
  proxy(process.env.DOCUMENT_SERVICE_URL, {
    proxyReqPathResolver: (req) => `/api/documents${req.url}`,
    proxyErrorHandler: (err, res, next) => {
      res.status(500).json({ error: "API Gateway Proxy Error (Document Service)" });
    },
  })
);

// // ✅ Proxy to Collaboration Service
// app.use(
//   "/api/collab",
//   proxy(process.env.COLLAB_SERVICE_URL, {
//     proxyReqPathResolver: (req) => `/api/collab${req.url}`,
//     proxyErrorHandler: (err, res, next) => {
//       res.status(500).json({ error: "API Gateway Proxy Error (Collaboration Service)" });
//     },
//   })
// );

// // ✅ Proxy to AI Suggestions Service
// app.use(
//   "/api/ai",
//   proxy(process.env.AI_SERVICE_URL, {
//     proxyReqPathResolver: (req) => `/api/ai${req.url}`,
//     proxyErrorHandler: (err, res, next) => {
//       res.status(500).json({ error: "API Gateway Proxy Error (AI Suggestions Service)" });
//     },
//   })
// );

// ✅ Start API Gateway
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 API Gateway running on port ${PORT}`));
