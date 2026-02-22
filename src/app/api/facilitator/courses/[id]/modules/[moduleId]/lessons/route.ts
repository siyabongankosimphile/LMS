import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import CourseModule from "@/models/Module";
import Lesson from "@/models/Lesson";

async function checkOwnership(courseId: string, userId: string, role: string) {
  const course = await Course.findById(courseId);
  if (!course) return null;
  if (role !== "ADMIN" && String(course.facilitator) !== userId) return null;
  return course;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const { id, moduleId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["FACILITATOR", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const course = await checkOwnership(id, session.user.id, session.user.role);
    if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const foundModule = await CourseModule.findById(moduleId);
    if (!foundModule || String(foundModule.course) !== id) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    const { title, order, videoUrl, content } = await req.json();
    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const lesson = await Lesson.create({
      module: moduleId,
      course: id,
      title,
      order: order || 0,
      videoUrl,
      content,
      resources: [],
    });

    return NextResponse.json(lesson, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
