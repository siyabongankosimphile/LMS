import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import GlossaryEntry from "@/models/GlossaryEntry";

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
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const searchParams = req.nextUrl.searchParams;
    const query = (searchParams.get("q") || "").trim();
    const category = (searchParams.get("category") || "").trim();

    await connectDB();
    const access = await canAccessCourse(id, session.user.id, session.user.role);
    if (!access) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const filter: Record<string, unknown> = { course: id };
    if (query) {
      filter.$or = [
        { term: { $regex: query, $options: "i" } },
        { definition: { $regex: query, $options: "i" } },
      ];
    }
    if (category) {
      filter.category = { $regex: `^${category}$`, $options: "i" };
    }

    const entries = await GlossaryEntry.find(filter)
      .populate("createdBy", "name surname role")
      .sort({ term: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({ entries });
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
    const { term, definition, category } = (await req.json()) as {
      term?: string;
      definition?: string;
      category?: string;
    };

    if (!term?.trim() || !definition?.trim()) {
      return NextResponse.json(
        { error: "Term and definition are required" },
        { status: 400 }
      );
    }

    await connectDB();
    const access = await canAccessCourse(id, session.user.id, session.user.role);
    if (!access) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const created = await GlossaryEntry.create({
      course: id,
      term: term.trim(),
      definition: definition.trim(),
      category: category?.trim() || undefined,
      createdBy: session.user.id,
    });

    const populated = await GlossaryEntry.findById(created._id)
      .populate("createdBy", "name surname role")
      .lean();

    return NextResponse.json({ entry: populated }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
