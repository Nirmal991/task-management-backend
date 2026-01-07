import { Schema, model, Document, Types } from "mongoose";

export type InviteStatus = "pending" | "accepting" | "expired";

export interface OrgInvite extends Document {
  orgId: Types.ObjectId,
  role: 'member';
  status: InviteStatus,
  createdAt: Date;
  expiresAt: Date;
}

const OrgInviteSchema  = new Schema<OrgInvite>(
  {
    orgId: {type: Schema.Types.ObjectId, ref: "Organization", required: true},
    role: {type: String, enum: ["member"], "default": "member"},
    status: {type: String,  enum: ["pending", "accepted", "expired"], default: "pending"},
    expiresAt: { type: Date, required: true },
  }, 
  { timestamps: true }
);

const Invitation =  model<OrgInvite>("OrgInvite", OrgInviteSchema)
export default Invitation;