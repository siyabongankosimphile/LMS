import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import Assignment from "@/models/Assignment";

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

    const assignments = await Assignment.find({ course: id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ assignments });
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
    const { title, description, dueAt, attachment } = (await req.json()) as {
      title?: string;
      description?: string;
      dueAt?: string;
      attachment?: {
        url?: string;
        key?: string;
        name?: string;
        contentType?: string;
        size?: number;
      };
    };

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    await connectDB();

    const allowed = await ownsCourse(id, session.user.id, session.user.role);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const assignment = await Assignment.create({
      course: id,
      title: title.trim(),
      description: description?.trim() || undefined,
      dueAt: dueAt ? new Date(dueAt) : undefined,
      attachment:
        attachment?.url && attachment?.key && attachment?.name
          ? {
              url: attachment.url,
              key: attachment.key,
              name: attachment.name,
              contentType: attachment.contentType,
              size: attachment.size,
            }
          : undefined,
      createdBy: session.user.id,
    });

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
