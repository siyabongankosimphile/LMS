import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Enrollment from "@/models/Enrollment";
import Link from "next/link";
import mongoose from "mongoose";
import DarkModeToggle from "@/components/DarkModeToggle";
import LogoutButton from "@/components/LogoutButton";
import DashboardMenu from "@/components/DashboardMenu";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function AdminUsersPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  const { q } = await searchParams;
  const query = (q || "").trim();

  await connectDB();

  const filter: Record<string, unknown> = {};
  if (query) {
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const queryRegex = new RegExp(escapedQuery, "i");
    const queryParts = query.split(/\s+/).filter(Boolean);

    const orConditions: Record<string, unknown>[] = [
      { saId: queryRegex },
      { name: queryRegex },
      { surname: queryRegex },
    ];

    if (mongoose.Types.ObjectId.isValid(query)) {
      orConditions.push({ _id: new mongoose.Types.ObjectId(query) });
    }

    if (queryParts.length >= 2) {
      const firstName = new RegExp(queryParts[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const surname = new RegExp(
        queryParts.slice(1).join(" ").replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );
      orConditions.push({ name: firstName, surname });
    }

    filter.$or = orConditions;
  }

  const users = await User.find(filter)
    .select("-password")
    .sort({ createdAt: -1 })
    .lean();

  const students = users.filter((user) => user.role === "STUDENT");
  const studentIds = students.map((student) => student._id);

  const studentProgressSummary = await Enrollment.aggregate([
    { $match: { student: { $in: studentIds } } },
    {
      $group: {
        _id: "$student",
        enrolledCourses: { $sum: 1 },
        completedCourses: {
          $sum: {
            $cond: [{ $eq: ["$completed", true] }, 1, 0],
          },
        },
        averageProgress: { $avg: "$progressPercent" },
      },
    },
  ]);

  const summaryMap = new Map<
    string,
    { enrolledCourses: number; completedCourses: number; averageProgress: number }
  >();

  studentProgressSummary.forEach((summary) => {
    summaryMap.set(String(summary._id), {
      enrolledCourses: summary.enrolledCourses || 0,
      completedCourses: summary.completedCourses || 0,
      averageProgress: Math.round(summary.averageProgress || 0),
    });
  });

  const studentsFinished = students.filter((student) => {
    const summary = summaryMap.get(String(student._id));
    return (summary?.completedCourses || 0) > 0;
  }).length;
  const studentsNotFinished = Math.max(students.length - studentsFinished, 0);

  const roleColors: Record<string, string> = {
    ADMIN: "bg-purple-100 text-purple-700",
    FACILITATOR: "bg-blue-100 text-blue-700",
    STUDENT: "bg-green-100 text-green-700",
  };

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    PENDING_APPROVAL: "bg-amber-100 text-amber-700",
    REJECTED: "bg-red-100 text-red-700",
  };

  return (
    <div className="dashboard-theme max-w-7xl mx-auto px-4 py-8 text-gray-900 dark:text-gray-100">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Users</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {query ? `Search results (${users.length})` : `All registered users (${users.length})`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DashboardMenu
            items={[
              { label: "Admin Dashboard", href: "/admin" },
              { label: "Operations", href: "/admin/operations" },
              { label: "Certificates", href: "/admin/certificates" },
              { label: "Activity", href: "/admin/activity" },
              { label: "Grade", href: "/admin/tools/grade" },
              { label: "Message", href: "/admin/tools/message" },
              { label: "Private File", href: "/admin/tools/private-file" },
              { label: "Preference", href: "/admin/tools/preference" },
              { label: "Filter", href: "/admin/tools/filter" },
              { label: "Calendar", href: "/admin/tools/calendar" },
              { label: "Users", href: "/admin/users" },
              { label: "Facilitators", href: "/admin/facilitators" },
            ]}
          />
          <DarkModeToggle />
          <LogoutButton />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-gray-500 dark:text-gray-300">Total Students</p>
          <p className="text-3xl font-bold text-blue-600">{students.length}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-gray-500 dark:text-gray-300">Students Finished</p>
          <p className="text-3xl font-bold text-green-600">{studentsFinished}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-gray-500 dark:text-gray-300">Students Not Finished</p>
          <p className="text-3xl font-bold text-amber-600">{studentsNotFinished}</p>
        </div>
      </div>

      <div className="mb-6 flex justify-end">
        <div className="flex gap-2">
          <Link
            href="/admin/users/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Create User
          </Link>
          <a
            href="/api/admin/reports/students"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Download Student Report (CSV)
          </a>
        </div>
      </div>

      <form action="/admin/users" method="GET" className="mb-6 rounded-xl border border-gray-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search by ID number, user ID, name, or surname"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Search
            </button>
            <Link
              href="/admin/users"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-gray-200 dark:hover:bg-slate-700"
            >
              Clear
            </Link>
          </div>
        </div>
      </form>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Name</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Email</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Role</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Progress</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Joined</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
              {users.map((user) => (
                <tr key={String(user._id)} className="hover:bg-gray-50 dark:hover:bg-slate-700/40">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {user.name} {user.surname || ""}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{user.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        roleColors[user.role] || ""
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        statusColors[user.status] || ""
                      }`}
                    >
                      {user.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                    {user.role === "STUDENT" ? (
                      <>
                        {(() => {
                          const summary = summaryMap.get(String(user._id)) || {
                            enrolledCourses: 0,
                            completedCourses: 0,
                            averageProgress: 0,
                          };
                          return `${summary.completedCourses}/${summary.enrolledCourses} completed • ${summary.averageProgress}% avg`;
                        })()}
                      </>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-300">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/users/${String(user._id)}`}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      Edit details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
