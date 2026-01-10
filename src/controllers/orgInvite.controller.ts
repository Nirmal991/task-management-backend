import { RequestHandler } from "express";
import crypto from "crypto";
import { AuthRequest, inviteMemberSchema, sendEmail } from "../lib";
import Organization from "../models/organization.model";
import User from "../models/user.model";
import Invitation from "../models/orgInvite.model";

export const inviteMembers: RequestHandler = async (
  req: AuthRequest,
  res
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { error, value } = inviteMemberSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      message: "Validation error",
      errors: error.details.map((e) => e.message),
    });
  }

  const { orgId } = req.params;
  const { email } = value;

  try {
    const org = await Organization.findById(orgId);
    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }

    const inviter = await User.findById(req.user.id);
    const isOwner = inviter?.orgs.some(
      (o) => o.orgId.toString() === orgId && o.role === "owner"
    );

    if (!isOwner) {
      return res.status(403).json({
        message: "Only organization owners can invite members",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");

    await Invitation.create({
      orgId,
      email,
      token,
      invitedBy: req.user.id,
      status: "pending",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
    });

    const inviteLink = `${process.env.CLIENT_URL}/accept-invite?token=${token}`;

    await sendEmail(
      email,
      `Invitation to join ${org.name}`,
      `
        <h3>You’ve been invited to join ${org.name}</h3>
        <p>Click the link below to accept the invitation:</p>
        <a href="${inviteLink}">${inviteLink}</a>
        <p>This link will expire in 24 hours.</p>
      `
    );

    return res.status(200).json({
      message: "Invitation sent successfully",
    });
  } catch (error) {
    console.error("Invite member error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


export const acceptOrgInvite: RequestHandler = async (
  req: AuthRequest,
  res
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { token } = req.body ;
  console.log("token", token);
  
  if (!token) {
    return res.status(400).json({ message: "Invite token is required" });
  }

  try {
    const invite = await Invitation.findOne({
      token,
      status: "pending",
    });

    if (!invite) {
      return res.status(400).json({
        message: "Invalid or already used invitation",
      });
    }
    if (invite.expiresAt < new Date()) {
      invite.status = "expired";
      await invite.save();
      return res.status(400).json({ message: "Invitation has expired" });
    }
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.orgs.push({
      orgId: invite.orgId,
      role: invite.role, // "member"
      joiningStatus: "accepted",
    });

    await user.save();
    invite.status = "accepted";
    await invite.save();

    return res.status(200).json({
      message: "Invitation accepted successfully",
      orgId: invite.orgId,
    });
  } catch (error) {
    console.error("Accept invite error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
