import express from "express";
import proxy from "express-http-proxy";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"], // Allow multiple frontend origins
    credentials: true, // Allow cookies/auth headers
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
  })
);

app.use(
  "/api/auth",
  proxy(process.env.AUTH_SERVICE_URL, {
    proxyReqPathResolver: (req) => `/api/auth${req.url}`,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      // Forward cookies and headers
      proxyReqOpts.headers = { ...srcReq.headers };
      return proxyReqOpts;
    },
    proxyErrorHandler: (err, res, next) => {
      res.status(500).json({ error: "API Gateway Proxy Error" });
    },
  })
);

app.use(
  "/api/documents",
  proxy(process.env.DOCUMENT_SERVICE_URL, {
    proxyReqPathResolver: (req) => `/api/documents${req.url}`,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      // Forward cookies and headers
      proxyReqOpts.headers = { ...srcReq.headers };
      return proxyReqOpts;
    },
    proxyErrorHandler: (err, res, next) => {
      res.status(500).json({ error: "API Gateway Document Service Proxy Error" });
    },
  })
);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));
