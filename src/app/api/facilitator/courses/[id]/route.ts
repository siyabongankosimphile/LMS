import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import crypto from "crypto";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import CourseModule from "@/models/Module";
import Lesson from "@/models/Lesson";
import Quiz from "@/models/Quiz";
import Enrollment from "@/models/Enrollment";
import Certificate from "@/models/Certificate";
import Announcement from "@/models/Announcement";

function hashKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

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
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
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
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      title,
      shortName,
      category,
      description,
      enrollmentKey,
      passMarkPercent,
      published,
      startDate,
      endDate,
      format,
      groupMode,
      gradeCategories,
    } = body;

    if (title) course.title = title;
    if (shortName !== undefined) course.shortName = shortName;
    if (category !== undefined) course.category = category;
    if (description) course.description = description;
    if (enrollmentKey) course.enrollmentKeyHash = hashKey(enrollmentKey);
    if (passMarkPercent !== undefined) course.passMarkPercent = passMarkPercent;
    if (published !== undefined) course.published = published;
    if (startDate !== undefined) {
      course.startDate = startDate ? new Date(startDate) : undefined;
    }
    if (endDate !== undefined) {
      course.endDate = endDate ? new Date(endDate) : undefined;
    }
    if (format !== undefined) course.format = format;
    if (groupMode !== undefined) course.groupMode = groupMode;
    if (Array.isArray(gradeCategories)) {
      course.gradeCategories = gradeCategories
        .filter(
          (item) =>
            item &&
            typeof item.name === "string" &&
            item.name.trim() &&
            typeof item.weight === "number"
        )
        .map((item) => ({
          name: item.name.trim(),
          weight: Math.max(0, Math.min(100, item.weight)),
        }));
    }

    await course.save();

    return NextResponse.json(course);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
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
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    await Promise.all([
      CourseModule.deleteMany({ course: id }),
      Lesson.deleteMany({ course: id }),
      Quiz.deleteMany({ course: id }),
      Announcement.deleteMany({ course: id }),
      Enrollment.deleteMany({ course: id }),
      Certificate.deleteMany({ course: id }),
      Course.findByIdAndDelete(id),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
