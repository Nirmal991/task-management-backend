import { RequestHandler } from "express";
import { AuthRequest, createTaskSchema } from "../lib";
import Task from "../models/task.model";
import Project from "../models/project.model";
import Organization from "../models/organization.model";

const ensureProjectMember = async (projectId: string, userId: string) => {
    const project = await Project.findById(projectId);
    if (!project) return { project: null, org: null};

    const org = await Organization.findById(project.organizationId);
    if (!org) return { project, org: null, isMember: false };

    return{ project, org };
}

export const createTask: RequestHandler = async(req: AuthRequest, res) => {
    if(!req.user) return res.status(401).json({message: "Unauthorized"})

        const { projectId } = req.params;
        const { orgId } = req.params;

        const{ error, value } = createTaskSchema.validate(req.body, {
            abortEarly: false
        });
        if (error) {
           return res.status(400).json({
            message: "Validation error",
            errors: error.details.map((e)=>e.message),
           });
        }

        try {

            const { project, org } = await ensureProjectMember(projectId, req.user.id);
            if(!project || !org){
                return res.status(404).json({message: "Project or Organization not found"})
            }

            const { title, description, status, priority, assignees, watchers, dueDate} = value;

            const task = await Task.create({
                organizationId: orgId,
                projectId: projectId,
                title,
                description,
                status, 
                priority,
                assignees: assignees || [],
                watchers : watchers || [],
                dueDate,
                createdBy: req.user.id
            })
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Server error" });
        }
}