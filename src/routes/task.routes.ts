import { Router } from "express";
import { requireAuth } from "../lib";
import { createTask } from "../controllers";


const router = Router();

router.post('/projects/:projectId/task', requireAuth, createTask);


export default router;