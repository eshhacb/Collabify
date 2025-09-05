import express from "express";
import proxy from "express-http-proxy";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();

// Set default service URLs if not in environment
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:5001";
const DOCUMENT_SERVICE_URL = process.env.DOCUMENT_SERVICE_URL || "http://localhost:5002";
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || "http://localhost:5004";
const COLLABORATION_SERVICE_URL = process.env.COLLABORATION_SERVICE_URL || "http://localhost:5003";
const AI_SUGGESTIONS_SERVICE_URL = process.env.AI_SUGGESTIONS_SERVICE_URL || "http://localhost:5005";

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"], // Allow multiple frontend origins
    credentials: true, // Allow cookies/auth headers
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allowed methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
  })
);
// Explicitly handle preflight across all routes
app.options("*", cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
}));

app.use(
  "/api/auth",
  proxy(AUTH_SERVICE_URL, {
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
  proxy(DOCUMENT_SERVICE_URL, {
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

app.use(
  "/api/invitations",
  proxy(NOTIFICATION_SERVICE_URL, {
    proxyReqPathResolver: (req) => `/api/invitations${req.url}`,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      // Forward cookies and headers
      proxyReqOpts.headers = { ...srcReq.headers };
      return proxyReqOpts;
    },
    userResHeaderDecorator: (headers, userReq) => {
      // Ensure proper CORS headers on proxied responses
      const allowed = new Set(["http://localhost:5173", "http://localhost:3000"]);
      const origin = userReq.headers.origin;
      if (origin && allowed.has(origin)) {
        headers["access-control-allow-origin"] = origin;
        headers["vary"] = "Origin";
        headers["access-control-allow-credentials"] = "true";
        headers["access-control-allow-headers"] = "Content-Type, Authorization";
        headers["access-control-allow-methods"] = "GET, POST, PUT, DELETE, OPTIONS";
      }
      return headers;
    },
    proxyErrorHandler: (err, res, next) => {
      res.status(500).json({ error: "API Gateway Notification Service Proxy Error" });
    },
  })
);

app.use(
  "/api/collaboration",
  proxy(COLLABORATION_SERVICE_URL, {
    proxyReqPathResolver: (req) => `/api/collaboration${req.url}`,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      // Forward cookies and headers
      proxyReqOpts.headers = { ...srcReq.headers };
      return proxyReqOpts;
    },
    proxyErrorHandler: (err, res, next) => {
      res.status(500).json({ error: "API Gateway Collaboration Service Proxy Error" });
    },
  })
);

app.use(
  "/api/ai-suggestion",
  proxy(AI_SUGGESTIONS_SERVICE_URL, {
    proxyReqPathResolver: (req) => `/api/ai-suggestion${req.url}`,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      // Forward cookies and headers
      proxyReqOpts.headers = { ...srcReq.headers };
      return proxyReqOpts;
    },
    proxyErrorHandler: (err, res, next) => {
      res.status(500).json({ error: "API Gateway AI Suggestions Service Proxy Error" });
    },
  })
);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));
