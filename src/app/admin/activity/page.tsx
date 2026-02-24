import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Enrollment from "@/models/Enrollment";
import Certificate from "@/models/Certificate";
import "@/models/Course";
import DarkModeToggle from "@/components/DarkModeToggle";
import LogoutButton from "@/components/LogoutButton";
import DashboardMenu from "@/components/DashboardMenu";

export default async function AdminActivityPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  await connectDB();

  const [latestUsers, latestEnrollments, latestCertificates] = await Promise.all([
    User.find({}).select("name surname role status createdAt").sort({ createdAt: -1 }).limit(10).lean(),
    Enrollment.find({}).populate("student", "name surname").populate("course", "title").sort({ createdAt: -1 }).limit(10).lean(),
    Certificate.find({}).populate("student", "name surname").populate("course", "title").sort({ createdAt: -1 }).limit(10).lean(),
  ]);

  return (
    <div className="dashboard-theme mx-auto max-w-7xl px-4 py-8 text-gray-900 dark:text-gray-100">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Activity</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-300">Monitor recent user, enrollment, and certificate events.</p>
        </div>
        <div className="flex items-center gap-2">
          <DashboardMenu
            items={[
              { label: "Admin Dashboard", href: "/admin" },
              { label: "Operations", href: "/admin/operations" },
              { label: "Certificates", href: "/admin/certificates" },
              { label: "Activity", href: "/admin/activity" },
              { label: "Users", href: "/admin/users" },
              { label: "Facilitators", href: "/admin/facilitators" },
            ]}
          />
          <DarkModeToggle />
          <LogoutButton />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-gray-100 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Recent Users</h2>
          <div className="space-y-3">
            {latestUsers.map((user) => (
              <div key={String(user._id)} className="rounded-lg border border-gray-100 px-3 py-2 text-sm dark:border-slate-700">
                <p className="font-medium text-gray-900 dark:text-white">{user.name} {user.surname || ""}</p>
                <p className="text-gray-500 dark:text-gray-300">{user.role} • {user.status}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(user.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-gray-100 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Recent Enrollments</h2>
          <div className="space-y-3">
            {latestEnrollments.map((item) => {
              const student = item.student as unknown as { name?: string; surname?: string };
              const course = item.course as unknown as { title?: string };
              return (
                <div key={String(item._id)} className="rounded-lg border border-gray-100 px-3 py-2 text-sm dark:border-slate-700">
                  <p className="font-medium text-gray-900 dark:text-white">{student?.name || "Student"} {student?.surname || ""}</p>
                  <p className="text-gray-500 dark:text-gray-300">{course?.title || "Course"}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(item.enrolledAt).toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border border-gray-100 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Recent Certificates</h2>
          <div className="space-y-3">
            {latestCertificates.map((item) => {
              const student = item.student as unknown as { name?: string; surname?: string };
              const course = item.course as unknown as { title?: string };
              return (
                <div key={String(item._id)} className="rounded-lg border border-gray-100 px-3 py-2 text-sm dark:border-slate-700">
                  <p className="font-medium text-gray-900 dark:text-white">{student?.name || "Student"} {student?.surname || ""}</p>
                  <p className="text-gray-500 dark:text-gray-300">{course?.title || "Course"}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(item.issuedAt).toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
