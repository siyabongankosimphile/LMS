import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import Lesson from "@/models/Lesson";
import Enrollment from "@/models/Enrollment";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CourseCompetenciesPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/courses/${id}/competencies`);
  }

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

  const totalLessons = await Lesson.countDocuments({ course: id });
  const completedLessons = enrollment?.completedLessons?.length || 0;
  const quizMastery = enrollment?.quizPassed ? "Mastered" : "In progress";

  const competencies = [
    {
      name: "Course participation",
      status: completedLessons > 0 ? "In progress" : "Not started",
    },
    {
      name: "Learning content completion",
      status:
        totalLessons > 0 && completedLessons >= totalLessons
          ? "Mastered"
          : completedLessons > 0
            ? "In progress"
            : "Not started",
    },
    {
      name: "Assessment mastery",
      status: quizMastery,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-4 text-sm text-gray-500 dark:text-gray-300">
        <Link href="/dashboard" className="hover:underline">Dashboard</Link>
        <span className="mx-2">&gt;</span>
        <Link href="/courses" className="hover:underline">My courses</Link>
        <span className="mx-2">&gt;</span>
        <Link href={`/courses/${id}`} className="hover:underline">{course.title}</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-gray-700 dark:text-gray-100">Competencies</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Competencies</h1>

      <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Completed lessons: {completedLessons}/{totalLessons}
        </p>
      </div>

      <div className="space-y-3">
        {competencies.map((competency) => (
          <div key={competency.name} className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{competency.name}</span>
            <span className="text-xs rounded-full bg-indigo-50 px-3 py-1 font-semibold text-indigo-700">
              {competency.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
