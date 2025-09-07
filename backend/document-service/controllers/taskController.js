import Task from "../models/Task.js";
import { validate as isUUID } from "uuid";

export const listTasks = async (req, res) => {
  try {
    const { documentId } = req.params;
    if (!documentId || !isUUID(documentId)) {
      return res.status(400).json({ message: "Invalid documentId" });
    }
    const tasks = await Task.findAll({ where: { documentId }, order: [["created_at", "DESC"]] });
    return res.json({ tasks });
  } catch (error) {
    return res.status(500).json({ message: "Error listing tasks", error: error.message });
  }
};

export const createTask = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { title, description, assigneeId, dueDate } = req.body;
    const createdBy = req.user.userId;

    if (!title || typeof title !== "string") {
      return res.status(400).json({ message: "'title' is required" });
    }

    const task = await Task.create({
      documentId,
      title,
      description: description || null,
      assigneeId: assigneeId || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      createdBy,
    });

    return res.status(201).json({ message: "Task created", task });
  } catch (error) {
    return res.status(500).json({ message: "Error creating task", error: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { documentId, taskId } = req.params;
    const { title, description, status, assigneeId, dueDate } = req.body;

    const task = await Task.findOne({ where: { id: taskId, documentId } });
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status; // assume validated in UI
    if (assigneeId !== undefined) task.assigneeId = assigneeId || null;
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;

    await task.save();
    return res.json({ message: "Task updated", task });
  } catch (error) {
    return res.status(500).json({ message: "Error updating task", error: error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { documentId, taskId } = req.params;
    const deleted = await Task.destroy({ where: { id: taskId, documentId } });
    if (!deleted) return res.status(404).json({ message: "Task not found" });
    return res.json({ message: "Task deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting task", error: error.message });
  }
};