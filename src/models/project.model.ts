// src/models/project.model.ts
import { Document, model, Schema, Types } from "mongoose";

export interface IProject extends Document {
  organizationId: Types.ObjectId;
  name: string;
  description?: string;
  members: Types.ObjectId[]; 
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

ProjectSchema.index(
  { organizationId: 1, name: 1 },
  { unique: true }
);

const Project = model<IProject>("Project", ProjectSchema);
export default Project;





// import { Document, model, Schema, Types } from "mongoose";

// export interface IProjectMember{
//     userId: Types.ObjectId;
// }

// export interface IProject extends Document{
//     organizationId: Types.ObjectId,
//     name: string,
//     description?: string;
//     members: IProjectMember[];
//     startDate: Date;
//     endDate: Date;
//     createdAt: Date;
//     updatedAt: Date;
// }

// const ProjectMemberSchema = new Schema<IProjectMember>(
//     {
//         userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
//     },
//     {_id: false}
// );

// const ProjectSchema = new Schema<IProject>(

//     {
//         organizationId: {
//             type: Schema.Types.ObjectId,
//             ref: "Organization",
//             required: true,
//         },
//         name: {type: String, required: true, trim: true},
//         description: {type: String, trim: true},
//         members: {type: [ProjectMemberSchema],
//         default: [],
//         },
//     },
//     {
//         timestamps: true
//     }
// );

// const Project = model<IProject>("Project", ProjectSchema);

// export default Project;