import mongoose, { Schema, Document, Model } from "mongoose";

export interface IQuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface IQuiz extends Document {
  _id: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  title: string;
  questions: IQuizQuestion[];
  passMarkPercent: number;
  createdAt: Date;
  updatedAt: Date;
}

const QuizSchema = new Schema<IQuiz>(
  {
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    title: { type: String, required: true },
    questions: [
      {
        question: { type: String, required: true },
        options: [{ type: String }],
        correctIndex: { type: Number, required: true },
      },
    ],
    passMarkPercent: { type: Number, default: 70 },
  },
  { timestamps: true }
);

const Quiz: Model<IQuiz> =
  mongoose.models.Quiz || mongoose.model<IQuiz>("Quiz", QuizSchema);

export default Quiz;
