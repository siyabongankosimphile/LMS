import mongoose, { Schema, Document, Model } from "mongoose";

export type QuizQuestionType =
  | "MCQ"
  | "DESCRIPTIVE"
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "SHORT_ANSWER"
  | "MATCHING"
  | "ESSAY";

export interface IQuizQuestion {
  type: QuizQuestionType;
  name?: string;
  question: string;
  marks?: number;
  options?: string[];
  correctIndex?: number;
  acceptedAnswers?: string[];
  matchingPairs?: Array<{ left: string; right: string }>;
  selfMarkingGuidance?: string;
  feedback?: string;
}

export interface IQuiz extends Document {
  _id: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  questions: IQuizQuestion[];
  passMarkPercent: number;
  openAt?: Date;
  closeAt?: Date;
  timeLimitMinutes?: number;
  gradeCategory?: string;
  attemptsAllowed: number;
  questionsPerPage: number;
  reviewOptions: {
    showMarks: boolean;
    showCorrectAnswers: boolean;
    showFeedback: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const QuizSchema = new Schema<IQuiz>(
  {
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    title: { type: String, required: true },
    questions: [
      {
        type: {
          type: String,
          enum: [
            "MCQ",
            "DESCRIPTIVE",
            "MULTIPLE_CHOICE",
            "TRUE_FALSE",
            "SHORT_ANSWER",
            "MATCHING",
            "ESSAY",
          ],
          default: "MULTIPLE_CHOICE",
          required: true,
        },
        name: { type: String },
        question: { type: String, required: true },
        marks: { type: Number, min: 0, default: 1 },
        options: [{ type: String }],
        correctIndex: { type: Number },
        acceptedAnswers: [{ type: String }],
        matchingPairs: [
          {
            left: { type: String },
            right: { type: String },
          },
        ],
        selfMarkingGuidance: { type: String },
        feedback: { type: String },
      },
    ],
    description: { type: String },
    passMarkPercent: { type: Number, default: 70 },
    openAt: { type: Date },
    closeAt: { type: Date },
    timeLimitMinutes: { type: Number, min: 1 },
    gradeCategory: { type: String, default: "Quiz" },
    attemptsAllowed: { type: Number, min: 1, default: 1 },
    questionsPerPage: { type: Number, min: 1, default: 5 },
    reviewOptions: {
      showMarks: { type: Boolean, default: true },
      showCorrectAnswers: { type: Boolean, default: false },
      showFeedback: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

const Quiz: Model<IQuiz> =
  mongoose.models.Quiz || mongoose.model<IQuiz>("Quiz", QuizSchema);

export default Quiz;
