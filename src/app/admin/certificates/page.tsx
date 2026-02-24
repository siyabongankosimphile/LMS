import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import Certificate from "@/models/Certificate";
import "@/models/User";
import "@/models/Course";
import DarkModeToggle from "@/components/DarkModeToggle";
import LogoutButton from "@/components/LogoutButton";
import DashboardMenu from "@/components/DashboardMenu";

export default async function AdminCertificatesPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  await connectDB();

  const certificates = await Certificate.find({})
    .populate("student", "name surname email")
    .populate("course", "title")
    .sort({ issuedAt: -1 })
    .limit(200)
    .lean();

  return (
    <div className="dashboard-theme mx-auto max-w-7xl px-4 py-8 text-gray-900 dark:text-gray-100">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Certificates</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-300">Manage issued certificates and downloads.</p>
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

      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white dark:border-slate-700 dark:bg-slate-800">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 dark:border-slate-700 dark:bg-slate-900">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Student</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Email</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Course</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Issued</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">File</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
            {certificates.map((item) => {
              const student = item.student as unknown as { name?: string; surname?: string; email?: string };
              const course = item.course as unknown as { title?: string };

              return (
                <tr key={String(item._id)} className="hover:bg-gray-50 dark:hover:bg-slate-700/40">
                  <td className="px-6 py-4 text-gray-900 dark:text-white">{student?.name || "-"} {student?.surname || ""}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{student?.email || "-"}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{course?.title || "-"}</td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-300">{new Date(item.issuedAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <a href={item.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                      Open
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
