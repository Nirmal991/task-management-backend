import { Router } from "express";
import { requireAuth } from "../lib";
import { createProject, deleteProject, getOrgProject, getProjectById, updateProject } from "../controllers";

const router = Router();

router.post("/organizations/:orgId/projects", requireAuth, createProject);

router.get("/organizations/:orgId/projects", requireAuth, getOrgProject);

router.get("/projects/:projectId", requireAuth, getProjectById);

router.patch("/projects/:projectId", requireAuth, updateProject);

router.delete("/projects/:projectId", requireAuth, deleteProject);

export default router;