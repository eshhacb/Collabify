import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

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
   
  },
  {
    tableName: "Document", // ✅ Prevents Sequelize from pluralizing
    timestamps: true, // ✅ Adds createdAt & updatedAt
    paranoid: true, // ✅ Enables soft deletes (deletedAt field)
  }
);

export default Document;