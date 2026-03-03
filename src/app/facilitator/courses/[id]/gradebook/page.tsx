import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import Assignment from "@/models/Assignment";
import Quiz from "@/models/Quiz";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function GradebookSetupPage({ params }: Props) {
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

  const [assignments, quiz] = await Promise.all([
    Assignment.find({ course: id }).sort({ createdAt: -1 }).lean(),
    Quiz.findOne({ course: id }).lean(),
  ]);

  const categories = Array.isArray(course.gradeCategories) ? course.gradeCategories : [];
  const categoryTotal = categories.reduce((sum, item) => sum + (item.weight || 0), 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gradebook setup</h1>
          <p className="text-sm text-gray-500">{course.title}</p>
        </div>
        <Link href={`/facilitator/courses/${id}`} className="text-sm text-blue-600 hover:underline">
          Back to course
        </Link>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-sm font-semibold text-gray-800 mb-2">Grade categories and weights</p>
        {categories.length === 0 ? (
          <p className="text-sm text-gray-500">No grade categories configured yet. Add them in course overview.</p>
        ) : (
          <div className="space-y-2">
            {categories.map((category, idx) => (
              <div key={`${category.name}-${idx}`} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm">
                <span>{category.name}</span>
                <span className="font-semibold text-indigo-700">{category.weight}%</span>
              </div>
            ))}
            <div className={`text-xs font-semibold ${categoryTotal === 100 ? "text-green-600" : "text-amber-600"}`}>
              Total weight: {categoryTotal}%
            </div>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-sm font-semibold text-gray-800 mb-2">Grade items</p>
        <div className="space-y-2 text-sm text-gray-700">
          {assignments.map((assignment) => (
            <p key={String(assignment._id)}>📝 {assignment.title} {assignment.dueAt ? `• due ${new Date(assignment.dueAt).toLocaleDateString()}` : ""}</p>
          ))}
          {quiz && <p>❓ {quiz.title} • category: {quiz.gradeCategory || "Quiz"}</p>}
          {assignments.length === 0 && !quiz && <p className="text-gray-500">No grade items yet.</p>}
        </div>
      </section>
    </div>
  );
}
