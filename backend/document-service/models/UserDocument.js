import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Document from "./Document.model.js";

const UserDocument = sequelize.define(
  "UserDocument",
  {
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true, // Ensures unique (user, document) pairs
    },
    documentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: Document, key: "id" },
      primaryKey: true, // Ensures unique (user, document) pairs
      onDelete: "CASCADE",
    },
    role: {
      type: DataTypes.ENUM("admin", "editor", "viewer"),
      allowNull: false,
    },
  },
  {
    tableName: "UserDocument",
    timestamps: true,
  }
);

// ✅ Define Correct Associations
Document.hasMany(UserDocument, { foreignKey: "documentId", onDelete: "CASCADE" });
UserDocument.belongsTo(Document, { foreignKey: "documentId" });

export default UserDocument;