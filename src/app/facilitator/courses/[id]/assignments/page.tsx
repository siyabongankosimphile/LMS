import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import AssignmentsManager from "./AssignmentsManager";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FacilitatorAssignmentsPage({ params }: Props) {
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

  return (
    <div className="dashboard-theme mx-auto max-w-6xl px-4 py-8 text-gray-900 dark:text-gray-100">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assignment Manager</h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">{course.title}</p>
        </div>
        <Link
          href={`/facilitator/courses/${id}`}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:border-slate-600 dark:hover:bg-slate-700"
        >
          Back to Course
        </Link>
      </div>

      <AssignmentsManager courseId={id} />
    </div>
  );
}
