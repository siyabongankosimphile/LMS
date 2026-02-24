import mongoose, { Document, Model, Schema } from "mongoose";

export interface IDiscussionPost extends Document {
  _id: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  authorRole: "ADMIN" | "FACILITATOR" | "STUDENT";
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

const DiscussionPostSchema = new Schema<IDiscussionPost>(
  {
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    authorRole: {
      type: String,
      enum: ["ADMIN", "FACILITATOR", "STUDENT"],
      required: true,
    },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

DiscussionPostSchema.index({ course: 1, createdAt: -1 });

const DiscussionPost: Model<IDiscussionPost> =
  mongoose.models.DiscussionPost ||
  mongoose.model<IDiscussionPost>("DiscussionPost", DiscussionPostSchema);

export default DiscussionPost;
