import mongoose, { Schema, Document, Model } from "mongoose";

export interface IModule extends Document {
  _id: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  title: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const ModuleSchema = new Schema<IModule>(
  {
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    title: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const CourseModule: Model<IModule> =
  mongoose.models.CourseModule ||
  mongoose.model<IModule>("CourseModule", ModuleSchema);

export default CourseModule;
