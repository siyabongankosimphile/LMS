import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import Announcement from "@/models/Announcement";

async function ownsCourse(courseId: string, userId: string, role: string) {
  const course = await Course.findById(courseId).lean();
  if (!course) return false;
  if (role === "ADMIN") return true;
  return String(course.facilitator) === userId;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["FACILITATOR", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await connectDB();

    const allowed = await ownsCourse(id, session.user.id, session.user.role);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const announcements = await Announcement.find({ course: id })
      .populate("createdBy", "name surname")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ announcements });
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
    if (!session?.user?.id || !["FACILITATOR", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { title, message } = (await req.json()) as {
      title?: string;
      message?: string;
    };

    if (!title?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "title and message are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const allowed = await ownsCourse(id, session.user.id, session.user.role);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const created = await Announcement.create({
      course: id,
      title: title.trim(),
      message: message.trim(),
      createdBy: session.user.id,
    });

    const populated = await Announcement.findById(created._id)
      .populate("createdBy", "name surname")
      .lean();

    return NextResponse.json({ announcement: populated }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
