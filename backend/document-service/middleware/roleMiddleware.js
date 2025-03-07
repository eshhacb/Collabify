import { validate as isUUID } from "uuid";
import UserDocument from "../models/UserDocument.js";

export const authorizeRoles = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Unauthorized: User not found in request" });
      }

      const userId = req.user.id; // ✅ Corrected user ID extraction
      const documentId = req.params.documentId;
      console.log("📄 Document ID from params:", documentId);

      // ✅ Validate UUID format
      if (!documentId || !isUUID(documentId)) {
        return res.status(400).json({ message: "Bad Request: Invalid document ID format (UUID required)" });
      }

      console.log(`🔍 Checking access for User ID: ${userId} on Document ID: ${documentId}`);

      // ✅ Check user's role in UserDocument table
      const userDoc = await UserDocument.findOne({ where: { userId, documentId } });

      if (!userDoc || !allowedRoles.includes(userDoc.role)) {
        console.log("❌ Access Denied: Insufficient Permissions");
        return res.status(403).json({ message: "Access Denied: Insufficient Permissions" });
      }

      console.log("✅ Access Granted");
      next();
    } catch (error) {
      console.error("❌ Authorization check failed:", error);
      return res.status(500).json({ message: "Authorization check failed", error: error.message });
    }
  };
};
