import mongoose, { Document, Schema, model } from "mongoose"


export interface IOrg extends Document {
  name: string;
  domain?: string;
  createdAt: Date;
  updatedAt: Date;
}


//For Org
const OrgSchema = new Schema<IOrg>(
    {
        name: { type: String, required: true, trim: true},
        domain: { type: String, trim: true },
    },
    {
        timestamps: true
    }
);

const Organization = model<IOrg>("Organization", OrgSchema);

export default Organization;