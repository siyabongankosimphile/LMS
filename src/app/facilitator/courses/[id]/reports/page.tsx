import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import Assignment from "@/models/Assignment";
import AssignmentSubmission from "@/models/AssignmentSubmission";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FacilitatorCourseReportsPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !["FACILITATOR", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  await connectDB();

  const course = await Course.findById(id).lean();
  if (!course) redirect("/facilitator");

  if (
    session.user.role !== "ADMIN" &&
    String(course.facilitator) !== session.user.id
  ) {
    redirect("/facilitator");
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
      { $match: { course: course._id } },
      { $group: { _id: null, avg: { $avg: "$progressPercent" } } },
    ]),
    Enrollment.countDocuments({ course: id, quizScore: { $ne: null } }),
    Enrollment.countDocuments({ course: id, quizPassed: true }),
    Assignment.countDocuments({ course: id }),
    AssignmentSubmission.countDocuments({ course: id }),
    AssignmentSubmission.countDocuments({ course: id, status: "GRADED" }),
    AssignmentSubmission.aggregate([
      { $match: { course: course._id, score: { $ne: null } } },
      { $group: { _id: null, avg: { $avg: "$score" } } },
    ]),
  ]);

  const stats = [
    { label: "Enrollments", value: totalEnrollments },
    { label: "Completed", value: completedEnrollments },
    { label: "Avg Progress", value: `${Math.round(avgProgressResult[0]?.avg || 0)}%` },
    { label: "Quiz Submissions", value: quizSubmittedCount },
    { label: "Quiz Passed", value: quizPassedCount },
    { label: "Assignments", value: assignmentCount },
    { label: "Assignment Submissions", value: submissionsCount },
    { label: "Graded", value: gradedCount },
    { label: "Avg Assignment Score", value: `${Math.round(avgScoreResult[0]?.avg || 0)}%` },
  ];

  return (
    <div className="dashboard-theme mx-auto max-w-6xl px-4 py-8 text-gray-900 dark:text-gray-100">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Course Report</h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">{course.title}</p>
        </div>
        <Link
          href={`/facilitator/courses/${id}`}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:border-slate-600 dark:hover:bg-slate-700"
        >
          Back to Course
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800"
          >
            <p className="text-sm text-gray-500 dark:text-gray-300">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
