import Task from "../models/Task.js";
import UserDocument from "../models/UserDocument.js";
import { Op } from "sequelize";
import { validate as isUUID } from "uuid";

export const listTasks = async (req, res) => {
  try {
    const { documentId } = req.params;
    if (!documentId || !isUUID(documentId)) {
      return res.status(400).json({ message: "Invalid documentId" });
    }

    const userId = req.user?.userId;
    const membership = await UserDocument.findOne({ where: { userId, documentId } });
    if (!membership) {
      return res.status(403).json({ message: "Access Denied: Not a collaborator" });
    }

    // Admin sees all tasks; non-admin sees only tasks assigned to them
    const where = { documentId };
    const isAdmin = membership.role === "admin";
    if (!isAdmin) {
      where.assigneeId = userId;
    }
    const tasks = await Task.findAll({ where, order: [["created_at", "DESC"]] });
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

    const userId = req.user.userId;
    const membership = await UserDocument.findOne({ where: { userId, documentId } });
    if (!membership) return res.status(403).json({ message: "Access Denied" });

    const isAdmin = membership.role === "admin";
    const isEditor = membership.role === "editor";
    const isAssignee = task.assigneeId === userId;

    if (isAdmin) {
      // Admin can change any field
      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (status !== undefined) task.status = status; // validated in UI
      if (assigneeId !== undefined) task.assigneeId = assigneeId || null;
      if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;
    } else if (isEditor) {
      // Editor can manage content fields but cannot reassign or schedule
      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (status !== undefined) task.status = status;
      // explicitly ignore assigneeId and dueDate when editor attempts to set
    } else if (isAssignee) {
      // assignee can only update status
      if (status !== undefined) task.status = status;
    } else {
      return res.status(403).json({ message: "Only assignee, editor (limited), or admin can update" });
    }

    await task.save();
    return res.json({ message: "Task updated", task });
  } catch (error) {
    return res.status(500).json({ message: "Error updating task", error: error.message });
  }
};

export const submitTask = async (req, res) => {
  try {
    const { documentId, taskId } = req.params;
    const { note } = req.body || {};
    const userId = req.user.userId;

    const task = await Task.findOne({ where: { id: taskId, documentId } });
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (task.assigneeId !== userId) {
      return res.status(403).json({ message: "Only the assignee can submit this task" });
    }

    task.submissionNote = note || null;
    task.submittedAt = new Date();
    task.status = "done";
    await task.save();

    return res.json({ message: "Task submitted", task });
  } catch (error) {
    return res.status(500).json({ message: "Error submitting task", error: error.message });
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