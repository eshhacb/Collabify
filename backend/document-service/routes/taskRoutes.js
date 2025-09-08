import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  submitTask,
} from "../controllers/taskController.js";

const router = express.Router({ mergeParams: true });

// List tasks for a document (viewer/editor/admin)
router.get(
  "/:documentId/tasks",
  authenticateToken,
  authorizeRoles("viewer", "editor", "admin"),
  listTasks
);

// Create task (admin only)
router.post(
  "/:documentId/tasks",
  authenticateToken,
  authorizeRoles("admin"),
  createTask
);

// Update task (editor/admin or assignee limited)
router.put(
  "/:documentId/tasks/:taskId",
  authenticateToken,
  authorizeRoles("viewer", "editor", "admin"),
  updateTask
);

// Submit task (assignee only; middleware allows viewer/editor/admin to reach controller where assignee is enforced)
router.post(
  "/:documentId/tasks/:taskId/submit",
  authenticateToken,
  authorizeRoles("viewer", "editor", "admin"),
  submitTask
);

// Delete task (admin)
router.delete(
  "/:documentId/tasks/:taskId",
  authenticateToken,
  authorizeRoles("admin"),
  deleteTask
);

export default router;