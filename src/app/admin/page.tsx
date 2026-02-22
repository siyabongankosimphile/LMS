import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import Link from "next/link";
import DarkModeToggle from "@/components/DarkModeToggle";
import LogoutButton from "@/components/LogoutButton";
import DashboardMenu from "@/components/DashboardMenu";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  await connectDB();

  const [
    totalStudents,
    totalFacilitators,
    pendingFacilitators,
    totalCourses,
    publishedCourses,
    totalEnrollments,
    finishedStudents,
  ] = await Promise.all([
    User.countDocuments({ role: "STUDENT" }),
    User.countDocuments({ role: "FACILITATOR" }),
    User.countDocuments({ role: "FACILITATOR", status: "PENDING_APPROVAL" }),
    Course.countDocuments(),
    Course.countDocuments({ published: true }),
    Enrollment.countDocuments(),
    Enrollment.distinct("student", { completed: true }),
  ]);

  const studentsFinished = finishedStudents.length;
  const studentsNotFinished = Math.max(totalStudents - studentsFinished, 0);

  const pendingFacilitatorList = await User.find({
    role: "FACILITATOR",
    status: "PENDING_APPROVAL",
  })
    .select("-password")
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  return (
    <div className="dashboard-theme max-w-7xl mx-auto px-4 py-8 text-gray-900 dark:text-gray-100">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your LMS platform</p>
        </div>
        <div className="flex items-center gap-2">
          <DashboardMenu
            items={[
              { label: "Admin Dashboard", href: "/admin" },
              { label: "Users", href: "/admin/users" },
              { label: "Facilitators", href: "/admin/facilitators" },
            ]}
          />
          <DarkModeToggle />
          <LogoutButton />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-8 gap-4 mb-8">
        {[
          { label: "Students", value: totalStudents, color: "blue" },
          { label: "Finished", value: studentsFinished, color: "green" },
          { label: "Not Finished", value: studentsNotFinished, color: "amber" },
          { label: "Facilitators", value: totalFacilitators, color: "indigo" },
          {
            label: "Pending",
            value: pendingFacilitators,
            color: pendingFacilitators > 0 ? "amber" : "green",
          },
          { label: "Total Courses", value: totalCourses, color: "purple" },
          { label: "Published", value: publishedCourses, color: "green" },
          { label: "Enrollments", value: totalEnrollments, color: "teal" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 text-center"
          >
            <div className={`text-2xl font-bold text-${stat.color}-600`}>
              {stat.value}
            </div>
            <div className="text-gray-500 dark:text-gray-300 text-xs mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-8 flex justify-end">
        <a
          href="/api/admin/reports/students"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Download Student Report (CSV)
        </a>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link
          href="/admin/users"
          className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-6 hover:shadow-md transition-shadow"
        >
          <div className="text-2xl mb-2">👥</div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Manage Users</h3>
          <p className="text-gray-500 dark:text-gray-300 text-sm">
            View and manage all students and facilitators
          </p>
        </Link>
        <Link
          href="/admin/facilitators"
          className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">👨‍🏫</span>
            {pendingFacilitators > 0 && (
              <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                {pendingFacilitators} pending
              </span>
            )}
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            Facilitator Approvals
          </h3>
          <p className="text-gray-500 dark:text-gray-300 text-sm">
            Review and approve facilitator applications
          </p>
        </Link>
      </div>

      {/* Pending facilitators */}
      {pendingFacilitatorList.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Pending Facilitator Approvals
            </h2>
            <Link
              href="/admin/facilitators"
              className="text-blue-600 text-sm hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-slate-700">
            {pendingFacilitatorList.map((f) => (
              <div
                key={String(f._id)}
                className="px-6 py-4 flex items-center justify-between"
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{f.name}</div>
                  <div className="text-gray-500 dark:text-gray-300 text-sm">{f.email}</div>
                </div>
                <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-medium">
                  Pending
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
