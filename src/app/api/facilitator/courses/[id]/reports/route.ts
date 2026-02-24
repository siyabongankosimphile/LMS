import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import Assignment from "@/models/Assignment";
import AssignmentSubmission from "@/models/AssignmentSubmission";

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

    const courseObjectId = new mongoose.Types.ObjectId(id);

    const allowed = await ownsCourse(id, session.user.id, session.user.role);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [
      totalEnrollments,
      completedEnrollments,
      avgProgressResult,
      quizSubmittedCount,
      quizPassedCount,
      assignmentCount,
      submissionsCount,
      gradedCount,
      avgScoreResult,
    ] = await Promise.all([
      Enrollment.countDocuments({ course: id }),
      Enrollment.countDocuments({ course: id, completed: true }),
      Enrollment.aggregate([
        { $match: { course: courseObjectId } },
        { $group: { _id: null, avg: { $avg: "$progressPercent" } } },
      ]),
      Enrollment.countDocuments({ course: id, quizScore: { $ne: null } }),
      Enrollment.countDocuments({ course: id, quizPassed: true }),
      Assignment.countDocuments({ course: id }),
      AssignmentSubmission.countDocuments({ course: id }),
      AssignmentSubmission.countDocuments({ course: id, status: "GRADED" }),
      AssignmentSubmission.aggregate([
        { $match: { course: courseObjectId, score: { $ne: null } } },
        { $group: { _id: null, avg: { $avg: "$score" } } },
      ]),
    ]);

    return NextResponse.json({
      report: {
        totalEnrollments,
        completedEnrollments,
        averageProgress: Math.round(avgProgressResult[0]?.avg || 0),
        quizSubmittedCount,
        quizPassedCount,
        assignmentCount,
        submissionsCount,
        gradedCount,
        averageAssignmentScore: Math.round(avgScoreResult[0]?.avg || 0),
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
