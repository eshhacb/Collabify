import { validate as isUUID } from "uuid";
import UserDocument from "../models/UserDocument.js";

export const authorizeRoles = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.userId) {
        return res.status(401).json({ message: "Unauthorized: User not found in request" });
      }

      const userId = req.user.userId; // from auth token
      const documentId = req.params.documentId;

      if (!documentId || !isUUID(documentId)) {
        return res.status(400).json({ message: "Bad Request: Invalid document ID format (UUID required)" });
      }

      const userDoc = await UserDocument.findOne({ where: { userId, documentId } });

      if (!userDoc || !allowedRoles.includes(userDoc.role)) {
        return res.status(403).json({ message: "Access Denied: Insufficient Permissions" });
      }

      next();
    } catch (error) {
      return res.status(500).json({ message: "Authorization check failed", error: error.message });
    }
  };
};