import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILesson extends Document {
  _id: mongoose.Types.ObjectId;
  module: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  title: string;
  order: number;
  videoUrl?: string;
  content?: string;
  resources: Array<{
    name: string;
    type: "file" | "link";
    url: string;
    key?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const LessonSchema = new Schema<ILesson>(
  {
    module: {
      type: Schema.Types.ObjectId,
      ref: "CourseModule",
      required: true,
    },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    title: { type: String, required: true },
    order: { type: Number, default: 0 },
    videoUrl: { type: String },
    content: { type: String },
    resources: [
      {
        name: { type: String },
        type: { type: String, enum: ["file", "link"] },
        url: { type: String },
        key: { type: String },
      },
    ],
  },
  { timestamps: true }
);

const Lesson: Model<ILesson> =
  mongoose.models.Lesson || mongoose.model<ILesson>("Lesson", LessonSchema);

export default Lesson;
