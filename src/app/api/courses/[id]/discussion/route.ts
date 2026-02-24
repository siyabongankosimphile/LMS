import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import DiscussionPost from "@/models/DiscussionPost";

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

    const posts = await DiscussionPost.find({ course: id })
      .populate("author", "name surname role")
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

    return NextResponse.json({ posts });
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { message } = (await req.json()) as { message?: string };

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    await connectDB();

    const access = await canAccessCourse(id, session.user.id, session.user.role);
    if (!access) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const post = await DiscussionPost.create({
      course: id,
      author: session.user.id,
      authorRole: session.user.role,
      message: message.trim(),
    });

    const created = await DiscussionPost.findById(post._id)
      .populate("author", "name surname role")
      .lean();

    return NextResponse.json({ post: created }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
