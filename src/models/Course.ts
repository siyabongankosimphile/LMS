import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICourse extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  facilitator: mongoose.Types.ObjectId;
  enrollmentKeyHash: string;
  thumbnail?: string;
  published: boolean;
  passMarkPercent: number;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    facilitator: { type: Schema.Types.ObjectId, ref: "User", required: true },
    enrollmentKeyHash: { type: String, required: true },
    thumbnail: { type: String },
    published: { type: Boolean, default: false },
    passMarkPercent: { type: Number, default: 70 },
  },
  { timestamps: true }
);

CourseSchema.index({ facilitator: 1, createdAt: -1 });
CourseSchema.index({ published: 1 });

const Course: Model<ICourse> =
  mongoose.models.Course || mongoose.model<ICourse>("Course", CourseSchema);

export default Course;
