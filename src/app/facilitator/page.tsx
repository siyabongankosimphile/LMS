import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import Assignment from "@/models/Assignment";
import Link from "next/link";
import DarkModeToggle from "@/components/DarkModeToggle";
import LogoutButton from "@/components/LogoutButton";
import DashboardMenu from "@/components/DashboardMenu";
import CourseActions from "./CourseActions";

export default async function FacilitatorDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !["FACILITATOR", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }
  if (session.user.role === "FACILITATOR" && session.user.status !== "ACTIVE") {
    redirect("/dashboard?error=pending_approval");
  }

  await connectDB();

  const courses = await Course.find(
    session.user.role === "ADMIN" ? {} : { facilitator: session.user.id }
  )
    .sort({ createdAt: -1 })
    .lean();

  const courseIds = courses.map((c) => c._id);
  const [enrollmentCounts, upcomingAssignments] = await Promise.all([
    Enrollment.aggregate([
      { $match: { course: { $in: courseIds } } },
      { $group: { _id: "$course", count: { $sum: 1 } } },
    ]),
    Assignment.find({
      course: { $in: courseIds },
      dueAt: { $gte: new Date() },
    })
      .sort({ dueAt: 1 })
      .limit(8)
      .lean(),
  ]);

  const enrollmentMap: Record<string, number> = {};
  enrollmentCounts.forEach((e) => {
    enrollmentMap[String(e._id)] = e.count;
  });

  return (
    <div className="dashboard-theme max-w-7xl mx-auto px-4 py-8 text-gray-900 dark:text-gray-100">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Facilitator Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your courses</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <DashboardMenu
            items={[
              { label: "Facilitator Dashboard", href: "/facilitator" },
              { label: "Create Course", href: "/facilitator/courses/new" },
            ]}
          />
          <LogoutButton />
          <DarkModeToggle />
          <Link
            href="/facilitator/courses/new"
            prefetch={false}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
          >
            + New Course
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="text-3xl font-bold text-blue-600">{courses.length}</div>
          <div className="text-gray-500 dark:text-gray-300 text-sm mt-1">Total Courses</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="text-3xl font-bold text-green-600">
            {courses.filter((c) => c.published).length}
          </div>
          <div className="text-gray-500 dark:text-gray-300 text-sm mt-1">Published</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="text-3xl font-bold text-purple-600">
            {Object.values(enrollmentMap).reduce((a, b) => a + b, 0)}
          </div>
          <div className="text-gray-500 dark:text-gray-300 text-sm mt-1">Total Students</div>
        </div>
      </div>

      {/* Courses */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="lg:col-span-1 rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 h-fit">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">Administration</h2>
          <div className="space-y-2 text-sm">
            <Link href="/facilitator/courses/new" className="block text-blue-600 hover:underline">
              Add a new course
            </Link>
            <Link href="/facilitator" className="block text-blue-600 hover:underline">
              Course management tools
            </Link>
            <Link href="/facilitator" className="block text-blue-600 hover:underline">
              Gradebook setup entry points
            </Link>
            <Link href="/facilitator" className="block text-blue-600 hover:underline">
              Student activity reports
            </Link>
          </div>
        </div>

        <div className="lg:col-span-3 rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">Timeline (due soon)</h2>
          {upcomingAssignments.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-300">No upcoming assignment deadlines.</p>
          ) : (
            <div className="space-y-2">
              {upcomingAssignments.map((assignment) => {
                const linkedCourse = courses.find(
                  (course) => String(course._id) === String(assignment.course)
                );
                return (
                  <div
                    key={String(assignment._id)}
                    className="rounded-lg border border-gray-100 dark:border-slate-700 px-3 py-2"
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{assignment.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-300">
                      {linkedCourse?.title || "Course"} • Due {assignment.dueAt ? new Date(assignment.dueAt).toLocaleDateString("en-ZA") : "-"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-12 text-center">
          <div className="text-5xl mb-4">📚</div>
          <p className="text-gray-500 dark:text-gray-300 mb-4">
            You haven&apos;t created any courses yet.
          </p>
          <Link
            href="/facilitator/courses/new"
            prefetch={false}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Create your first course
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Course</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Status</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Students</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Created</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                {courses.map((course) => (
                  <tr key={String(course._id)} className="hover:bg-gray-50 dark:hover:bg-slate-700/40">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {course.title}
                      </div>
                      <div className="text-gray-500 dark:text-gray-300 text-xs mt-0.5 line-clamp-1">
                        {course.description}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          course.published
                            ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                            : "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-200"
                        }`}
                      >
                        {course.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {enrollmentMap[String(course._id)] || 0}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-300">
                      {new Date(course.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <CourseActions
                        courseId={String(course._id)}
                        courseTitle={course.title}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
