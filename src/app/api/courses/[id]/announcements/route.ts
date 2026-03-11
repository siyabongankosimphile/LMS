import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import Announcement from "@/models/Announcement";

async function canAccessCourse(courseId: string, userId: string, role: string) {
  const course = await Course.findById(courseId).lean();
  if (!course) return false;

  if (role === "ADMIN") return true;
  if (role === "FACILITATOR") {
    return String(course.facilitator) === userId;
  }

  if (role === "STUDENT") {
    const enrollment = await Enrollment.findOne({
      student: userId,
      course: courseId,
    }).lean();
    return !!enrollment;
  }

  return false;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const access = await canAccessCourse(id, session.user.id, session.user.role);
    if (!access) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const announcements = await Announcement.find({ course: id })
      .populate("createdBy", "name surname")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
