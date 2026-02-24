import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import Quiz from "@/models/Quiz";

type IncomingQuestion = {
  type?: string;
  name?: string;
  question?: string;
  marks?: number;
  options?: string[];
  correctIndex?: number;
  acceptedAnswers?: string[];
  matchingPairs?: Array<{ left?: string; right?: string }>;
  selfMarkingGuidance?: string;
  feedback?: string;
};

async function checkOwnership(courseId: string, userId: string, role: string) {
  const course = await Course.findById(courseId);
  if (!course) return null;
  if (role !== "ADMIN" && String(course.facilitator) !== userId) return null;
  return course;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["FACILITATOR", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const course = await checkOwnership(id, session.user.id, session.user.role);
    if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const quizzes = await Quiz.find({ course: id }).lean();
    return NextResponse.json({ quizzes });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["FACILITATOR", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const {
      title,
      description,
      openAt,
      closeAt,
      timeLimitMinutes,
      gradeCategory,
      attemptsAllowed,
      passMarkPercent,
      questionsPerPage,
      reviewOptions,
      questions,
    } = await req.json();

    if (!title || !questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: "title and questions are required" },
        { status: 400 }
      );
    }

    const openDate = openAt ? new Date(openAt) : undefined;
    const closeDate = closeAt ? new Date(closeAt) : undefined;
    if (openDate && Number.isNaN(openDate.getTime())) {
      return NextResponse.json({ error: "Invalid openAt date" }, { status: 400 });
    }
    if (closeDate && Number.isNaN(closeDate.getTime())) {
      return NextResponse.json({ error: "Invalid closeAt date" }, { status: 400 });
    }
    if (openDate && closeDate && closeDate <= openDate) {
      return NextResponse.json(
        { error: "closeAt must be later than openAt" },
        { status: 400 }
      );
    }

    const normalizedAttempts =
      typeof attemptsAllowed === "number" && attemptsAllowed >= 1
        ? Math.floor(attemptsAllowed)
        : 1;
    const normalizedQuestionsPerPage =
      typeof questionsPerPage === "number" && questionsPerPage >= 1
        ? Math.floor(questionsPerPage)
        : 5;
    const normalizedTimeLimit =
      typeof timeLimitMinutes === "number" && timeLimitMinutes >= 1
        ? Math.floor(timeLimitMinutes)
        : undefined;

    const normalizedReviewOptions = {
      showMarks: reviewOptions?.showMarks !== false,
      showCorrectAnswers: reviewOptions?.showCorrectAnswers === true,
      showFeedback: reviewOptions?.showFeedback !== false,
    };

    const normalizedQuestions = (questions as IncomingQuestion[]).map((question) => {
      const questionType = question.type || "MULTIPLE_CHOICE";
      const marks =
        typeof question.marks === "number" && question.marks > 0
          ? question.marks
          : 1;

      if (!question?.question || !questionType) {
        throw new Error("Each question must include type and question");
      }

      if (questionType === "MCQ" || questionType === "MULTIPLE_CHOICE") {
        const options = (question.options || []).map((opt) => String(opt).trim()).filter(Boolean);
        const hasOptions = options.length >= 2;
        const validCorrectIndex =
          typeof question.correctIndex === "number" &&
          question.correctIndex >= 0 &&
          question.correctIndex < options.length;

        if (!hasOptions || !validCorrectIndex) {
          throw new Error("Multiple choice questions require options (2+) and a valid correct answer");
        }

        return {
          type: "MULTIPLE_CHOICE",
          name: question.name?.trim() || undefined,
          question: question.question.trim(),
          marks,
          options,
          correctIndex: question.correctIndex,
          feedback: question.feedback?.trim() || undefined,
        };
      }

      if (questionType === "TRUE_FALSE") {
        const correctIndex = question.correctIndex === 1 ? 1 : 0;
        return {
          type: "TRUE_FALSE",
          name: question.name?.trim() || undefined,
          question: question.question.trim(),
          marks,
          options: ["True", "False"],
          correctIndex,
          feedback: question.feedback?.trim() || undefined,
        };
      }

      if (questionType === "SHORT_ANSWER") {
        const acceptedAnswers = (question.acceptedAnswers || [])
          .map((answer) => String(answer).trim())
          .filter(Boolean);
        if (acceptedAnswers.length === 0) {
          throw new Error("Short answer questions require at least one accepted answer");
        }

        return {
          type: "SHORT_ANSWER",
          name: question.name?.trim() || undefined,
          question: question.question.trim(),
          marks,
          acceptedAnswers,
          feedback: question.feedback?.trim() || undefined,
        };
      }

      if (questionType === "MATCHING") {
        const matchingPairs = (question.matchingPairs || [])
          .map((pair) => ({
            left: pair.left?.trim() || "",
            right: pair.right?.trim() || "",
          }))
          .filter((pair) => pair.left && pair.right);
        if (matchingPairs.length < 2) {
          throw new Error("Matching questions require at least two pairs");
        }

        return {
          type: "MATCHING",
          name: question.name?.trim() || undefined,
          question: question.question.trim(),
          marks,
          matchingPairs,
          feedback: question.feedback?.trim() || undefined,
        };
      }

      if (questionType === "ESSAY" || questionType === "DESCRIPTIVE") {
        return {
          type: "ESSAY",
          name: question.name?.trim() || undefined,
          question: question.question.trim(),
          marks,
          selfMarkingGuidance: question.selfMarkingGuidance?.trim() || undefined,
          feedback: question.feedback?.trim() || undefined,
        };
      }

      throw new Error("Unsupported question type");
    });

    await connectDB();
    const course = await checkOwnership(id, session.user.id, session.user.role);
    if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const quiz = await Quiz.findOneAndUpdate(
      { course: id },
      {
        $set: {
          title: String(title).trim(),
          description: description?.trim() || undefined,
          openAt: openDate,
          closeAt: closeDate,
          timeLimitMinutes: normalizedTimeLimit,
          gradeCategory: gradeCategory?.trim() || "Quiz",
          attemptsAllowed: normalizedAttempts,
          passMarkPercent:
            typeof passMarkPercent === "number" &&
            passMarkPercent >= 0 &&
            passMarkPercent <= 100
              ? passMarkPercent
              : 70,
          questionsPerPage: normalizedQuestionsPerPage,
          reviewOptions: normalizedReviewOptions,
          questions: normalizedQuestions,
        },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();

    return NextResponse.json(quiz, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
