import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import User from "@/models/User";

async function checkOwnership(courseId: string, userId: string, role: string) {
  const course = await Course.findById(courseId).lean();
  if (!course) return null;
  if (role !== "ADMIN" && String(course.facilitator) !== userId) return null;
  return course;
}

export async function GET(
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
    if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [participants, availableStudents] = await Promise.all([
      Enrollment.find({ course: id })
        .populate("student", "name surname email status")
        .sort({ enrolledAt: -1 })
        .lean(),
      User.find({ role: "STUDENT", status: "ACTIVE" })
        .select("name surname email")
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const enrolledIds = new Set(participants.map((p) => String(p.student)));
    const candidates = availableStudents.filter(
      (student) => !enrolledIds.has(String(student._id))
    );

    return NextResponse.json({ participants, candidates });
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

    const { studentId } = (await req.json()) as { studentId?: string };
    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 });
    }

    await connectDB();

    const course = await checkOwnership(id, session.user.id, session.user.role);
    if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const student = await User.findOne({ _id: studentId, role: "STUDENT" }).lean();
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const existing = await Enrollment.findOne({ course: id, student: studentId }).lean();
    if (existing) {
      return NextResponse.json({ error: "Student already enrolled" }, { status: 409 });
    }

    const created = await Enrollment.create({
      student: studentId,
      course: id,
      completedLessons: [],
      progressPercent: 0,
      completed: false,
      quizAttempts: 0,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["FACILITATOR", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const studentId = req.nextUrl.searchParams.get("studentId");
    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 });
    }

    await connectDB();

    const course = await checkOwnership(id, session.user.id, session.user.role);
    if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await Enrollment.findOneAndDelete({ course: id, student: studentId });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
