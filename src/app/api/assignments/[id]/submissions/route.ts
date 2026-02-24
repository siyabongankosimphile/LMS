import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Assignment from "@/models/Assignment";
import Course from "@/models/Course";
import AssignmentSubmission from "@/models/AssignmentSubmission";

async function canManageAssignment(
  assignmentId: string,
  userId: string,
  role: string
) {
  const assignment = await Assignment.findById(assignmentId).lean();
  if (!assignment) return null;

  const course = await Course.findById(assignment.course).lean();
  if (!course) return null;

  if (role === "ADMIN") return assignment;
  if (role === "FACILITATOR" && String(course.facilitator) === userId) {
    return assignment;
  }

  return null;
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

    const assignment = await canManageAssignment(id, session.user.id, session.user.role);
    if (!assignment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const submissions = await AssignmentSubmission.find({ assignment: id })
      .populate("student", "name surname email")
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({ assignment, submissions });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
