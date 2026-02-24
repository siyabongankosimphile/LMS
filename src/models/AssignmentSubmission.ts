import mongoose, { Document, Model, Schema } from "mongoose";

export interface IAssignmentSubmission extends Document {
  _id: mongoose.Types.ObjectId;
  assignment: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  content?: string;
  attachment?: {
    url: string;
    key: string;
    name: string;
    contentType?: string;
    size?: number;
  };
  status: "SUBMITTED" | "GRADED";
  score?: number;
  feedback?: string;
  submittedAt: Date;
  gradedAt?: Date;
  gradedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSubmissionSchema = new Schema<IAssignmentSubmission>(
  {
    assignment: {
      type: Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, trim: true },
    attachment: {
      url: { type: String, trim: true },
      key: { type: String, trim: true },
      name: { type: String, trim: true },
      contentType: { type: String, trim: true },
      size: { type: Number },
    },
    status: {
      type: String,
      enum: ["SUBMITTED", "GRADED"],
      default: "SUBMITTED",
    },
    score: { type: Number, min: 0, max: 100 },
    feedback: { type: String, trim: true },
    submittedAt: { type: Date, default: Date.now },
    gradedAt: { type: Date },
    gradedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

AssignmentSubmissionSchema.index(
  { assignment: 1, student: 1 },
  { unique: true }
);
AssignmentSubmissionSchema.index({ course: 1, student: 1 });
AssignmentSubmissionSchema.index({ assignment: 1, status: 1 });

const AssignmentSubmission: Model<IAssignmentSubmission> =
  mongoose.models.AssignmentSubmission ||
  mongoose.model<IAssignmentSubmission>(
    "AssignmentSubmission",
    AssignmentSubmissionSchema
  );

export default AssignmentSubmission;
