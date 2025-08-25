import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

// PostgreSQL: documents table
// Columns: id | title | owner_id | created_at
// Note: No hard FK to users table to avoid cross-service dependency during sync.
const Document = sequelize.define(
  "Document",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "owner_id",
    },
  },
  {
    tableName: "documents",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [{ fields: ["owner_id"] }],
  }
);

export default Document;