import { RequestHandler } from "express";
import Organization from "../models/organization.model";
import Project from "../models/project.model";
import { AuthRequest, createProjectSchema, updateProjectSchema } from "../lib";
import mongoose, { Types } from "mongoose";
import User from "../models/user.model";

export const ensureOrgMember = async (orgId: string, userId: string) => {
  const [org, user] = await Promise.all([
    Organization.findById(orgId),
    User.findOne({
      _id: userId,
      "orgs.orgId": orgId,
      "orgs.joiningStatus": "accepted",
    }),
  ]);

  if (!org || !user) {
    return { org: null, user: null };
  }

  return { org, user };
};

//Owner can only create project
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

  const { name, description, userIds = [] } = value;

  try {
    const { org, user } = await ensureOrgMember(orgId, req.user.id);
    if (!org || !user) {
      return res
        .status(403)
        .json({ message: "Not a member of this organization" });
    }

    const isOwner = user.orgs.some(
      (o) =>
        o.orgId.toString() === orgId &&
        o.role === "owner" &&
        o.joiningStatus === "accepted"
    );

    if (!isOwner) {
      return res
        .status(403)
        .json({ message: "Only Owner can create the Organization" });
    }

    const assignedUsers = await User.find({
      _id: { $in: userIds },
      "orgs.orgId": orgId,
      "orgs.joiningStatus": "accepted",
    }).select("_id");

    const memberIds = assignedUsers.map((u) => u._id);

    if (!memberIds.some((id) => id.equals(req.user!.id))) {
      memberIds.push(new Types.ObjectId(req.user!.id));
    }

    const project = await Project.create({
      organizationId: org._id,
      name,
      description,
      members: memberIds,
    });

    return res.status(201).json({
      message: "Project created successfully",
      data: project,
    });
  } catch (error) {
    console.error("Create project error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

//Get Project of specific org
export const getOrgProject: RequestHandler = async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { orgId } = req.params;

  try {
    // 1️⃣ Ensure user belongs to org
    const { org, user } = await ensureOrgMember(orgId, req.user.id);

    if (!org || !user) {
      return res
        .status(403)
        .json({ message: "You are not a member of this organization" });
    }

    // 2️⃣ Fetch only projects user belongs to
    const projects = await Project.find({
      organizationId: orgId,
      members: req.user.id, // user must be in project
    });

    return res.status(200).json({
      message: "Projects fetched successfully",
      data: projects,
    });
  } catch (err) {
    console.error("Get org projects error:", err);
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
    // 1️⃣ Load project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // 2️⃣ Ensure user is org member
    const { org, user } = await ensureOrgMember(
      project.organizationId.toString(),
      req.user.id
    );

    if (!org || !user) {
      return res.status(403).json({
        message: "You are not a member of this organization",
      });
    }

    // 3️⃣ Ensure user is a project member
    const isProjectMember = project.members.some((id) =>
      id.equals(req.user!.id)
    );

    if (!isProjectMember) {
      return res.status(403).json({
        message: "You are not a member of this project",
      });
    }

    return res.status(200).json({
      message: "Project fetched successfully",
      data: project,
    });
  } catch (err) {
    console.error("Get project error:", err);
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
    // 1️⃣ Load project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // 2️⃣ Ensure org membership
    const { org, user } = await ensureOrgMember(
      project.organizationId.toString(),
      req.user.id
    );
    if (!org || !user) {
      return res.status(403).json({
        message: "Not a member of this organization",
      });
    }

    // 3️⃣ Ensure project access (project member OR org owner)
    const isOwner = user.orgs.some(
      (o) =>
        o.orgId.toString() === project.organizationId.toString() &&
        o.role === "owner" &&
        o.joiningStatus === "accepted"
    );

    if (!isOwner) {
      return res.status(403).json({
        message: "Only organization owners can update projects",
      });
    }

    // 4️⃣ Update fields
    if (value.name !== undefined) project.name = value.name;
    if (value.description !== undefined)
      project.description = value.description;

    // 5️⃣ Handle members
    const addMembers = value.addMembers || [];
    const removeMembers = value.removeMembers || [];

    if (addMembers.length || removeMembers.length) {
      // Validate added users belong to org
      const validUsers = await User.find({
        _id: { $in: addMembers },
        "orgs.orgId": project.organizationId,
        "orgs.joiningStatus": "accepted",
      }).select("_id");

      const validIds = validUsers.map((u) => u._id.toString());

      // Add
      validIds.forEach((id) => {
        if (!project.members.some((m) => m.equals(id))) {
          project.members.push(new Types.ObjectId(id));
        }
      });

      // Remove (but never remove last member)
      project.members = project.members.filter((id) => {
        if (removeMembers.includes(id.toString())) {
          return false;
        }
        return true;
      });

      if (project.members.length === 0) {
        return res.status(400).json({
          message: "Project must have at least one member",
        });
      }
    }

    await project.save();

    return res.status(200).json({
      message: "Project updated successfully",
      data: project,
    });
  } catch (err) {
    console.error("Update project error:", err);
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
    // 1️⃣ Load project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // 2️⃣ Ensure user belongs to org
    const { org, user } = await ensureOrgMember(
      project.organizationId.toString(),
      req.user.id
    );

    if (!org || !user) {
      return res.status(403).json({
        message: "You are not a member of this organization",
      });
    }
    const isOwner = user.orgs.some(
      (o) =>
        o.orgId.toString() === project.organizationId.toString() &&
        o.role === "owner" &&
        o.joiningStatus === "accepted"
    );

    if (!isOwner) {
      return res.status(403).json({
        message: "Only organization owners can update projects",
      });
    }

    // 4️⃣ Delete project
    await project.deleteOne();

    return res.status(200).json({
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Delete project error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
