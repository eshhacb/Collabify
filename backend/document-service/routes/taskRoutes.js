import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
} from "../controllers/taskController.js";

const router = express.Router({ mergeParams: true });

// List tasks for a document (viewer/editor/admin)
router.get(
  "/:documentId/tasks",
  authenticateToken,
  authorizeRoles("viewer", "editor", "admin"),
  listTasks
);

// Create task (editor/admin)
router.post(
  "/:documentId/tasks",
  authenticateToken,
  authorizeRoles("editor", "admin"),
  createTask
);

// Update task (editor/admin)
router.put(
  "/:documentId/tasks/:taskId",
  authenticateToken,
  authorizeRoles("editor", "admin"),
  updateTask
);

// Delete task (admin)
router.delete(
  "/:documentId/tasks/:taskId",
  authenticateToken,
  authorizeRoles("admin"),
  deleteTask
);

export default router;