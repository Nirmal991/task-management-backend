import mongoose, {Schema, Document, model, Types} from "mongoose";

export type OrgRole = "owner" | "member"
export type orgJoiningStatus = "accepted" | "pending" | "invited"

export interface IUserOrg {
    orgId: Types.ObjectId;
    role: OrgRole;
    joiningStatus: orgJoiningStatus
}

export interface IUser extends Document {
    username: string
    email: string
    password: string
    orgs: IUserOrg[]
    createdAt: Date
    updatedAt: Date
}

const UserOrgSchema: Schema = new Schema<IUserOrg>({
    orgId: {type: Schema.Types.ObjectId, ref: "Organization", required: true},
    role: {type: String, enum: ["owner", "member"], required: true},
    joiningStatus: {
        type: String,
        enum: ["accepted", "pending", "rejected"],
        default: "accepted",
    },
},{ _id: false }
)

const UserSchema: Schema = new Schema<IUser>({
    username: {type: String, required: true},
    email: {type: String, required: true, unique: true, lowercase: true},
    password: { type: String, required: true },
    orgs: { type: [UserOrgSchema], default: [] },
},{timestamps: true})



const User = model<IUser>("User", UserSchema);
export default User;