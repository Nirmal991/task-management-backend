import { RequestHandler } from "express";
import { AuthRequest, inviteMemberSchema, transporter } from "../lib";
import Organization from "../models/organization.model";
import User from "../models/user.model";
import Invitation from "../models/orgInvite.model";

export const inviteMembers: RequestHandler = async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { orgId } = req.params;
  const { email } = req.body;

  console.log("req.params:", req.params);
  console.log("req.body:", req.body);
  console.log("extracted email:", email, "| type:", typeof email);

  if (!email || typeof email !== "string") {
    console.log(" Invalid email value:", email);
    return res.status(400).json({
      message: "Valid email is required",
      received: email,
    });
  }

  try {
    const org = await Organization.findById(orgId);
    if (!org)
      return res.status(404).json({ message: "Organization not found" });

    const inviter = await User.findById(req.user.id);
    const isOwner = inviter?.orgs.some(
      (o) => o.orgId.toString() === orgId && o.role === "owner"
    );
    if (!isOwner) {
      return res.status(403).json({ message: "Only owners can invite" });
    }

    const invite = await Invitation.create({
        orgId,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    })
      console.log("📨 Sending email to:", email);

    await transporter.sendMail({
        to: email,
        subject: `Invitation to join ${org.name}`,
        html: `<h3>You have been invited to join ${org.name}</h3>`,
    })

    return res.status(200).json({
      message: "Invitation sent successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};
