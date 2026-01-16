import { Router } from "express";
import { requireAuth } from "../lib";
import { createTask, deleteTask, getTaskById, getTaskOfProject, updateTask } from "../controllers";

const router = Router();

router.post('/projects/:projectId/task', requireAuth, createTask);
router.get('/projects/:projectId/task',requireAuth, getTaskOfProject)
router.get("/task/:taskId", requireAuth, getTaskById);
router.patch("/task/:taskId", requireAuth, updateTask);
router.delete("/task/:taskId", requireAuth, deleteTask);

export default router;