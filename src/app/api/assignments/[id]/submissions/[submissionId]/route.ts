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
  if (!assignment) return false;

  const course = await Course.findById(assignment.course).lean();
  if (!course) return false;

  if (role === "ADMIN") return true;
  return role === "FACILITATOR" && String(course.facilitator) === userId;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; submissionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["FACILITATOR", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, submissionId } = await params;
    const { score, feedback } = (await req.json()) as {
      score?: number;
      feedback?: string;
    };

    if (typeof score !== "number" || score < 0 || score > 100) {
      return NextResponse.json({ error: "Score must be between 0 and 100" }, { status: 400 });
    }

    await connectDB();

    const allowed = await canManageAssignment(id, session.user.id, session.user.role);
    if (!allowed) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const submission = await AssignmentSubmission.findOneAndUpdate(
      { _id: submissionId, assignment: id },
      {
        $set: {
          score,
          feedback: feedback?.trim() || "",
          status: "GRADED",
          gradedAt: new Date(),
          gradedBy: session.user.id,
        },
      },
      { new: true }
    )
      .populate("student", "name surname email")
      .lean();

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    return NextResponse.json({ submission });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
