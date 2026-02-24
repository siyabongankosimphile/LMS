import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import Quiz from "@/models/Quiz";

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

    const { title, questions, passMarkPercent } = await req.json();
    if (!title || !questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: "title and questions are required" },
        { status: 400 }
      );
    }

    for (const question of questions) {
      if (!question?.question || !question?.type) {
        return NextResponse.json(
          { error: "Each question must include type and question" },
          { status: 400 }
        );
      }

      if (question.type === "MCQ") {
        const hasOptions =
          Array.isArray(question.options) && question.options.length >= 2;
        const validCorrectIndex =
          typeof question.correctIndex === "number" &&
          question.correctIndex >= 0 &&
          hasOptions &&
          question.correctIndex < question.options.length;

        if (!hasOptions || !validCorrectIndex) {
          return NextResponse.json(
            {
              error:
                "MCQ questions require options (2+) and a valid correctIndex",
            },
            { status: 400 }
          );
        }
      }

      if (question.type === "DESCRIPTIVE") {
        question.options = [];
        question.correctIndex = undefined;
      }
    }

    await connectDB();
    const course = await checkOwnership(id, session.user.id, session.user.role);
    if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const quiz = await Quiz.create({
      course: id,
      title,
      questions,
      passMarkPercent: passMarkPercent || 70,
    });

    return NextResponse.json(quiz, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
