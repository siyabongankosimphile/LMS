import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import Assignment from "@/models/Assignment";
import AssignmentSubmission from "@/models/AssignmentSubmission";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CourseGradesPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect(`/login?callbackUrl=/courses/${id}/grades`);

  await connectDB();

  const course = await Course.findById(id).lean();
  if (!course) redirect("/courses");

  const enrollment = await Enrollment.findOne({
    course: id,
    student: session.user.id,
  }).lean();

  if (session.user.role === "STUDENT" && !enrollment) {
    redirect(`/courses/${id}`);
  }

  const assignments = await Assignment.find({ course: id })
    .sort({ dueAt: 1, createdAt: -1 })
    .lean();

  const submissions = await AssignmentSubmission.find({
    course: id,
    student: session.user.id,
  })
    .sort({ submittedAt: -1 })
    .lean();

  const submissionByAssignment = new Map(
    submissions.map((submission) => [String(submission.assignment), submission])
  );

  const gradeItems = assignments.map((assignment) => {
    const submission = submissionByAssignment.get(String(assignment._id));
    return {
      id: String(assignment._id),
      type: "Assignment",
      title: assignment.title,
      submittedAt: submission?.submittedAt,
      gradedAt: submission?.gradedAt,
      status: submission?.status || "NOT_SUBMITTED",
      grade: typeof submission?.score === "number" ? submission.score : null,
      feedback: submission?.feedback || "",
    };
  });

  if (enrollment?.quizScore !== undefined && enrollment?.quizScore !== null) {
    gradeItems.push({
      id: "course-quiz",
      type: "Quiz",
      title: "Course Quiz",
      submittedAt: undefined,
      gradedAt: undefined,
      status: enrollment.quizPassed ? "PASSED" : "COMPLETED",
      grade: enrollment.quizScore,
      feedback: enrollment.quizPassed ? "Passed" : "Not passed yet",
    });
  }

  const gradedValues = gradeItems
    .map((item) => item.grade)
    .filter((value): value is number => typeof value === "number");
  const courseTotal =
    gradedValues.length > 0
      ? Number(
          (
            gradedValues.reduce((sum, value) => sum + value, 0) /
            gradedValues.length
          ).toFixed(1)
        )
      : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-4 text-sm text-gray-500 dark:text-gray-300">
        <Link href="/dashboard" className="hover:underline">Dashboard</Link>
        <span className="mx-2">&gt;</span>
        <Link href="/courses" className="hover:underline">My courses</Link>
        <span className="mx-2">&gt;</span>
        <Link href={`/courses/${id}`} className="hover:underline">{course.title}</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-gray-700 dark:text-gray-100">Grades</span>
      </div>

      <div className="mb-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Gradebook</h1>
        <div className="rounded-full bg-indigo-50 px-4 py-1 text-sm font-semibold text-indigo-700">
          Course Total: {courseTotal !== null ? `${courseTotal}%` : "-"}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <table className="min-w-[760px] text-sm">
          <thead className="bg-gray-50 dark:bg-slate-900 text-left text-xs text-gray-600 dark:text-gray-300">
            <tr>
              <th className="px-4 py-3">Activity</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Graded</th>
              <th className="px-4 py-3">Grade</th>
              <th className="px-4 py-3">Feedback</th>
            </tr>
          </thead>
          <tbody>
            {gradeItems.map((item) => (
              <tr key={item.id} className="border-t border-gray-100 dark:border-slate-700 text-gray-800 dark:text-gray-100">
                <td className="px-4 py-3">{item.title}</td>
                <td className="px-4 py-3">{item.type}</td>
                <td className="px-4 py-3">{String(item.status).replaceAll("_", " ")}</td>
                <td className="px-4 py-3">
                  {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString("en-ZA") : "-"}
                </td>
                <td className="px-4 py-3">
                  {item.gradedAt ? new Date(item.gradedAt).toLocaleDateString("en-ZA") : "-"}
                </td>
                <td className="px-4 py-3">{item.grade !== null ? `${item.grade}%` : "-"}</td>
                <td className="px-4 py-3 max-w-xs truncate">{item.feedback || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
