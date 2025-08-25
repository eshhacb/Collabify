import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Document from "./Document.model.js";

// PostgreSQL: user_documents (many-to-many with role)
// Columns: id | user_id | doc_id | role | invited_by | joined_at
// Note: Drop hard FKs to users to avoid cross-service dependency.
const UserDocument = sequelize.define(
  "UserDocument",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "user_id",
    },
    documentId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "doc_id",
      references: { model: Document, key: "id" },
      onDelete: "CASCADE",
    },
    role: {
      type: DataTypes.ENUM("admin", "editor", "viewer"),
      allowNull: false,
      defaultValue: "viewer",
    },
    invitedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "invited_by",
    },
  },
  {
    tableName: "user_documents",
    timestamps: true,
    createdAt: "joined_at",
    updatedAt: false,
    indexes: [{ fields: ["user_id"] }, { fields: ["doc_id"] }],
  }
);

// Associations for document
Document.hasMany(UserDocument, { foreignKey: "doc_id", sourceKey: "id", onDelete: "CASCADE" });
UserDocument.belongsTo(Document, { foreignKey: "doc_id", targetKey: "id" });

export default UserDocument;