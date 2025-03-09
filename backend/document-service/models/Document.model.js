import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Document = sequelize.define(
  "Document",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4, // ✅ Auto-generates UUID
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "Document",
    timestamps: true,
    paranoid: true,
  }
);

export default Document;
