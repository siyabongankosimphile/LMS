import mongoose, { Document, Model, Schema } from "mongoose";

export interface IAssignment extends Document {
  _id: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  dueAt?: Date;
  attachment?: {
    url: string;
    key: string;
    name: string;
    contentType?: string;
    size?: number;
  };
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    dueAt: { type: Date },
    attachment: {
      url: { type: String, trim: true },
      key: { type: String, trim: true },
      name: { type: String, trim: true },
      contentType: { type: String, trim: true },
      size: { type: Number },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

AssignmentSchema.index({ course: 1, createdAt: -1 });

const Assignment: Model<IAssignment> =
  mongoose.models.Assignment ||
  mongoose.model<IAssignment>("Assignment", AssignmentSchema);

export default Assignment;
