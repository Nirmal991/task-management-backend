// src/models/orgInvite.model.ts
import { Schema, model, Document, Types } from "mongoose";

export type InviteStatus = "pending" | "accepted" | "expired";
export type InviteRole = "member";

export interface OrgInvite extends Document {
  orgId: Types.ObjectId;
  email: string;
  token: string;
  role: InviteRole;
  status: InviteStatus;
  invitedBy: Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrgInviteSchema = new Schema<OrgInvite>(
  {
    orgId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    role: {
      type: String,
      enum: ["member"],
      default: "member",
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "expired"],
      default: "pending",
    },

    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);


const Invitation = model<OrgInvite>("OrgInvite", OrgInviteSchema);
export default Invitation;
