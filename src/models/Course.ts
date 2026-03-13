import mongoose, { Schema, Document, Model } from "mongoose";
import "@/models/User";

export interface ICourse extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  shortName?: string;
  category?: string;
  description: string;
  welcomeMessage?: string;
  facilitator: mongoose.Types.ObjectId;
  enrollmentKeyHash: string;
  thumbnail?: string;
  startDate?: Date;
  endDate?: Date;
  format?: "TOPICS" | "WEEKLY" | "GRID";
  groupMode?: "NO_GROUPS" | "SEPARATE_GROUPS" | "VISIBLE_GROUPS";
  published: boolean;
  passMarkPercent: number;
  gradeCategories: Array<{
    name: string;
    weight: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true },
    shortName: { type: String, trim: true },
    category: { type: String, trim: true },
    description: { type: String, required: true },
    welcomeMessage: { type: String, trim: true },
    facilitator: { type: Schema.Types.ObjectId, ref: "User", required: true },
    enrollmentKeyHash: { type: String, required: true },
    thumbnail: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    format: {
      type: String,
      enum: ["TOPICS", "WEEKLY", "GRID"],
      default: "TOPICS",
    },
    groupMode: {
      type: String,
      enum: ["NO_GROUPS", "SEPARATE_GROUPS", "VISIBLE_GROUPS"],
      default: "NO_GROUPS",
    },
    published: { type: Boolean, default: false },
    passMarkPercent: { type: Number, default: 70 },
    gradeCategories: [
      {
        name: { type: String, trim: true },
        weight: { type: Number, min: 0, max: 100, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

CourseSchema.index({ facilitator: 1, createdAt: -1 });
CourseSchema.index({ published: 1 });

const Course: Model<ICourse> =
  mongoose.models.Course || mongoose.model<ICourse>("Course", CourseSchema);

export default Course;
