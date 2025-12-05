import { RequestHandler } from "express";
import Organization from "../models/organization.model";
import Project from "../models/project.model";
import { AuthRequest, createProjectSchema, updateProjectSchema } from "../lib";

//check User
const ensureOrgMember = async (orgId: string, userId: string) => {
  const org = await Organization.findById(orgId);
  if (!org) return { org: null, isMember: false };

  
  return { org };
};

//Create Project
export const createProject: RequestHandler = async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { orgId } = req.params;

  const { error, value } = createProjectSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({
      message: "Validation error",
      errors: error.details.map((e) => e.message),
    });
  }

  const { name, description, startDate, endDate } = value;

  try {
    //check the user
    const { org, isMember } = await ensureOrgMember(orgId, req.user.id);
    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }
    // if (!isMember) {
    //   return res
    //     .status(403)
    //     .json({ message: "You are not a member of this organization" });
    // }

    const project = await Project.create({
      organizationId: org._id,
      name,
      description,
      startDate,
      endDate,
      members: [{ userId: req.user.id }],
    });

    return res.status(201).json({
      message: "Project created successfully",
      data: project,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

//Get Project od specific org
export const getOrgProject: RequestHandler = async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { orgId } = req.params;

  try {
    const { org, isMember } = await ensureOrgMember(orgId, req.user.id);
    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }
    // if (!isMember) {
    //   return res
    //     .status(403)
    //     .json({ message: "You are not a member of this organization" });
    // }

    const projects = await Project.find({ organizationId: orgId });

    return res.json({
      message: "Projects fetched successfully",
      data: projects,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// get project By Id
export const getProjectById: RequestHandler = async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { projectId } = req.params;

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check membership via org
    const { isMember } = await ensureOrgMember(
      project.organizationId.toString(),
      req.user.id
    );
    // if (!isMember) {
    //   return res
    //     .status(403)
    //     .json({ message: "You are not a member of this project/organization" });
    // }

    return res.json({
      message: "Project fetched successfully",
      data: project,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

//Update the project byID
export const updateProject: RequestHandler = async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { projectId } = req.params;

  const { error, value } = updateProjectSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    return res.status(400).json({
      message: "Validation error",
      errors: error.details.map((e) => e.message),
    });
  }

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const { isMember } = await ensureOrgMember(
      project.organizationId.toString(),
      req.user.id
    );
    if (!isMember) {
      return res
        .status(403)
        .json({ message: "You are not allowed to update this project" });
    }

    Object.assign(project, value); //use to update the data
    await project.save();

    return res.json({
      message: "Project updated successfully",
      data: project,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

//detele project by Id
export const deleteProject: RequestHandler = async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { projectId } = req.params;

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const { isMember } = await ensureOrgMember(
      project.organizationId.toString(),
      req.user.id
    );
    if (!isMember) {
      return res.status(403).json({ message: "You are not allowed to delete this project" });
    }

    await project.deleteOne(); //deleted

    return res.json({
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};