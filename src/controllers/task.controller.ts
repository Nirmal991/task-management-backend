import { RequestHandler } from "express";
import { AuthRequest, createTaskSchema, updateTaskSchema } from "../lib";
import Task from "../models/task.model";
import Project from "../models/project.model";
import Organization from "../models/organization.model";
import User from "../models/user.model";
import { ensureOrgMember } from "./project.controller";
import { Types } from "mongoose";

const ensureProjectMember = async (projectId: string, userId: string) => {
  const project = await Project.findById(projectId);
  if (!project) {
    return { project: null, org: null, user: null };
  }

  const user = await User.findOne({
    _id: userId,
    "orgs.orgId": project.organizationId,
    "orgs.joiningStatus": "accepted",
  });

  if (!user) return { project, org: null, user: null };

  const isProjectMember = project.members.some((id) => id.equals(userId));

  if (!isProjectMember) return { project, org: null, user: null };

  const org = await Organization.findById(project.organizationId);
  if (!org) return { project, org: null, user: null };

  return { project, org, user };
};

//Create Task
export const createTask: RequestHandler = async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { projectId } = req.params;

  const { error, value } = createTaskSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    res.status(400).json({
      message: "Validation error",
      errors: error.details.map((err) => err.message),
    });
  }

  const { title, description, priority, dueDate, assignees } = value;

  try {
    const { project, org, user } = await ensureProjectMember(
      projectId,
      req.user.id
    );

    if (!project || !org || !user) {
      return res
        .status(403)
        .json({ message: "You do not have access to this project" });
    }

    const projectMemberIds = project.members.map((m) => m.toString());

    const validAssignees = assignees.filter((id: string) =>
      projectMemberIds.includes(id)
    );

    const task = await Task.create({
      organizationId: project.organizationId,
      projectId: project._id,
      title,
      description,
      priority,
      dueDate,
      assignees: validAssignees,
      createdBy: user._id,
    }); 

    return res
      .status(201)
      .json({ message: "Task Created successfully", data: task });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

//get task of Projects
export const getTaskOfProject: RequestHandler = async (
  req: AuthRequest,
  res
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const { projectId } = req.params;

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    const { org, user } = await ensureOrgMember(
      project.organizationId.toString(),
      req.user.id
    );
    if (!org || !user) {
      return res.status(403).json({
        message: "You are not a member of this organization",
      });
    }

    const isProjectMember = project.members.some((id) =>
      id.equals(req.user!.id)
    );

    const isOrgOwner = user.orgs.some(
      (o) =>
        o.orgId.toString() === project.organizationId.toString() &&
        o.role === "owner"
    );

    if (!isProjectMember && !isOrgOwner) {
      return res.status(403).json({
        message: "You do not have access to this project",
      });
    }

    // 4️⃣ Fetch all tasks for this project
    const tasks = await Task.find({ projectId: project._id });

    return res.status(200).json({
      message: "Tasks fetched successfully",
      data: tasks,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

//get task by Id
export const getTaskById: RequestHandler = async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { taskId } = req.params;

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    const project = await Project.findById(task.projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const { org, user } = await ensureOrgMember(
      project.organizationId.toString(),
      req.user.id
    );
    if (!org || !user) {
      return res.status(403).json({
        message: "You are not a member of this organization",
      });
    }

    const isProjectMember = project.members.some((id) =>
      id.equals(req.user!.id)
    );

    const isOrgOwner = user.orgs.some(
      (o) =>
        o.orgId.toString() === project.organizationId.toString() &&
        o.role === "owner"
    );

    if (!isProjectMember && !isOrgOwner) {
      return res.status(403).json({
        message: "You do not have access to this task",
      });
    }

    return res.status(200).json({
      message: "Task fetched successfully",
      data: task,
    });
  } catch (error) {
    console.error("Get task error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

//update task By Id
export const updateTask: RequestHandler = async (
  req: AuthRequest,
  res
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { taskId } = req.params;

  const { error, value } = updateTaskSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({
      message: "Validation error",
      errors: error.details.map((e) => e.message),
    });
  }

  try {
    // 1️⃣ Load task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // 2️⃣ Load project
    const project = await Project.findById(task.projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // 3️⃣ Ensure org membership
    const { org, user } = await ensureOrgMember(
      project.organizationId.toString(),
      req.user.id
    );
    if (!org || !user) {
      return res.status(403).json({
        message: "You are not a member of this organization",
      });
    }

    // 4️⃣ Permission: Org owner OR task assignee
    const isOrgOwner = user.orgs.some(
      (o) =>
        o.orgId.toString() === project.organizationId.toString() &&
        o.role === "owner"
    );

    const isAssignee = task.assignees.some((id) =>
      id.equals(req.user!.id)
    );

    if (!isOrgOwner && !isAssignee) {
      return res.status(403).json({
        message: "You do not have permission to update this task",
      });
    }

    // 5️⃣ Update fields
    if (value.title !== undefined) task.title = value.title;
    if (value.description !== undefined) task.description = value.description;
    if (value.status !== undefined) task.status = value.status;
    if (value.priority !== undefined) task.priority = value.priority;
    if (value.dueDate !== undefined) task.dueDate = value.dueDate;

    // 6️⃣ Handle assignees
    const projectMemberIds = project.members.map((m) => m.toString());

    if (value.addAssignees) {
      value.addAssignees.forEach((id: string) => {
        if (
          projectMemberIds.includes(id) &&
          !task.assignees.some((a) => a.equals(id))
        ) {
          task.assignees.push(new Types.ObjectId(id));
        }
      });
    }

    if (value.removeAssignees) {
      task.assignees = task.assignees.filter(
        (id) => !value.removeAssignees.includes(id.toString())
      );
    }

    await task.save();

    return res.status(200).json({
      message: "Task updated successfully",
      data: task,
    });
  } catch (error) {
    console.error("Update task error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteTask: RequestHandler = async (
  req: AuthRequest,
  res
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { taskId } = req.params;

  try {

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findById(task.projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const { org, user } = await ensureOrgMember(
      project.organizationId.toString(),
      req.user.id
    );

    if (!org || !user) {
      return res.status(403).json({
        message: "You are not a member of this organization",
      });
    }

    const isProjectMember = project.members.some((id) =>
      id.equals(req.user!.id)
    );

    const isOrgOwner = user.orgs.some(
      (o) =>
        o.orgId.toString() === project.organizationId.toString() &&
        o.role === "owner"
    );

    if (!isProjectMember && !isOrgOwner) {
      return res.status(403).json({
        message: "You do not have permission to delete this task",
      });
    }

    await task.deleteOne();

    return res.status(200).json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete task error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

