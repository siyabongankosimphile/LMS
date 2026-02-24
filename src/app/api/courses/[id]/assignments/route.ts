import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import Assignment from "@/models/Assignment";
import AssignmentSubmission from "@/models/AssignmentSubmission";

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

    const assignments = await Assignment.find({ course: id })
      .sort({ createdAt: -1 })
      .lean();

    if (session.user.role !== "STUDENT") {
      return NextResponse.json({ assignments });
    }

    const assignmentIds = assignments.map((item) => item._id);
    const submissions = await AssignmentSubmission.find({
      assignment: { $in: assignmentIds },
      student: session.user.id,
    })
      .sort({ updatedAt: -1 })
      .lean();

    const submissionsByAssignment = new Map(
      submissions.map((submission) => [String(submission.assignment), submission])
    );

    const merged = assignments.map((assignment) => ({
      ...assignment,
      mySubmission: submissionsByAssignment.get(String(assignment._id)) || null,
    }));

    return NextResponse.json({ assignments: merged });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
