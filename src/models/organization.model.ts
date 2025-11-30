import mongoose, { Document, Schema, Types } from "mongoose"

export type OrgRole  = 'owner' | 'member'

export interface IOrgMember {
  user: Types.ObjectId;
  role: OrgRole;
}

export interface IOrg extends Document {
  name: string;
  domain?: string;
  members: IOrgMember[];
  createdAt: Date;
  updatedAt: Date;
}


// for the members
const OrgMemberSchema = new Schema<IOrgMember>(
    {
        user: {type: Schema.Types.ObjectId, ref: "User", required: true},
        role: {type: String,enum: ['owner', 'member'], default: 'member'}
    },
    { _id: false}
)


//For Org
const OrgSchema = new Schema<IOrg>(
    {
        name: { type: String, required: true, trim: true},
        domain: { type: String, trim: true },
        members: {
            type: [OrgMemberSchema],
            default: [],
        },
    },
    {
        timestamps: true
    }
);

const Organization = mongoose.model<IOrg>("Organization", OrgSchema);

export default Organization;