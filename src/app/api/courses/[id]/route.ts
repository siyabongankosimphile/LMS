import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import CourseModule from "@/models/Module";
import Lesson from "@/models/Lesson";
import Quiz from "@/models/Quiz";
import Enrollment from "@/models/Enrollment";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    const session = await getServerSession(authOptions);

    const course = await Course.findById(id)
      .populate("facilitator", "name email image")
      .lean();

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const modules = await CourseModule.find({ course: id })
      .sort({ order: 1 })
      .lean();

    const lessons = await Lesson.find({ course: id })
      .sort({ order: 1 })
      .lean();

    const quiz = await Quiz.findOne({ course: id }).lean();

    let enrollment = null;
    if (session?.user?.id) {
      enrollment = await Enrollment.findOne({
        student: session.user.id,
        course: id,
      }).lean();
    }

    // Build modules with their lessons (strip resources for non-enrolled users)
    const modulesWithLessons = modules.map((m) => ({
      ...m,
      lessons: lessons
        .filter((l) => String(l.module) === String(m._id))
        .map((l) => ({
          ...l,
          videoUrl: enrollment ? l.videoUrl : undefined,
          resources: enrollment ? l.resources : [],
          content: enrollment ? l.content : undefined,
        })),
    }));

    return NextResponse.json({
      course,
      modules: modulesWithLessons,
      quiz: quiz
        ? {
            _id: quiz._id,
            title: quiz.title,
            passMarkPercent: quiz.passMarkPercent,
            questionCount: quiz.questions.length,
          }
        : null,
      enrollment,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
