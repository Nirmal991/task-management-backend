import { RequestHandler } from "express";
import crypto from "crypto";
import {
  AuthRequest,
  generatePassword,
  inviteMemberSchema,
  sendEmail,
} from "../lib";
import Organization from "../models/organization.model";
import User from "../models/user.model";
import Invitation from "../models/orgInvite.model";
import bcrypt from "bcryptjs";

export const inviteMembers: RequestHandler = async (req: AuthRequest, res) => {
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
  const { token } = req.query;
  // console.log("token", token);

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
    let user = await User.findOne({ email: invite.email });

    if (!user) {
      // return res.status(404).json({ message: "User not found" });
      const password = generatePassword();
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(password, salt);
      const username = invite.email.split("@")[0];

      // org create
      const orgName = `${username}'s org`;
      const orgDomain = `${username.toLowerCase()}.com`;

      const org = await Organization.create({
        name: orgName,
        domain: orgDomain,
      });

      user = new User({
        username,
        email: invite.email,
        password: hashed,
        orgs: [
          {
            orgId: org._id,
            role: "owner",
            joiningStatus: "accepted",
          },
        ],
      });

      await sendEmail(invite.email, `Welcome, to the ${org.name}`, `Password: ${password}`);
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
