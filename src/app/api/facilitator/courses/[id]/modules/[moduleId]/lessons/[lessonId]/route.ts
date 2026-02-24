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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string; lessonId: string }> }
) {
  try {
    const { id, moduleId, lessonId } = await params;
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

    const lesson = await Lesson.findById(lessonId);
    if (!lesson || String(lesson.module) !== moduleId || String(lesson.course) !== id) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const { title, videoUrl, content, resources } = await req.json();

    if (typeof title === "string") lesson.title = title;
    if (typeof videoUrl === "string" || videoUrl === null) {
      lesson.videoUrl = videoUrl || undefined;
    }
    if (typeof content === "string" || content === null) {
      lesson.content = content || undefined;
    }
    if (Array.isArray(resources)) {
      lesson.resources = resources;
    }

    await lesson.save();

    return NextResponse.json(lesson);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
