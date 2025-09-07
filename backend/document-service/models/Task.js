import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Document from "./Document.model.js";

// PostgreSQL: tasks per document
// Columns: id | doc_id | title | description | status | assignee_id | created_by | due_date | created_at | updated_at
const Task = sequelize.define(
  "Task",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    documentId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "doc_id",
      references: { model: Document, key: "id" },
      onDelete: "CASCADE",
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("todo", "in_progress", "done"),
      allowNull: false,
      defaultValue: "todo",
    },
    assigneeId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "assignee_id",
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "created_by",
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "due_date",
    },
  },
  {
    tableName: "tasks",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["doc_id"] },
      { fields: ["assignee_id"] },
      { fields: ["status"] }
    ],
  }
);

// Associations for document
Document.hasMany(Task, { foreignKey: "doc_id", sourceKey: "id", onDelete: "CASCADE" });
Task.belongsTo(Document, { foreignKey: "doc_id", targetKey: "id" });

export default Task;