import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import AdminUserEditor from "./AdminUserEditor";
import DarkModeToggle from "@/components/DarkModeToggle";
import LogoutButton from "@/components/LogoutButton";
import DashboardMenu from "@/components/DashboardMenu";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminUserDetailsPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  const { id } = await params;

  await connectDB();

  const [user, courses] = await Promise.all([
    User.findById(id).select("-password").lean(),
    Course.find({ published: true }).select("title").sort({ title: 1 }).lean(),
  ]);

  if (!user) redirect("/admin/users");

  const enrollments =
    user.role === "STUDENT"
      ? await Enrollment.find({ student: user._id })
          .populate("course", "title")
          .sort({ createdAt: -1 })
          .lean()
      : [];

  return (
    <div className="dashboard-theme mx-auto max-w-7xl px-4 py-8 text-gray-900 dark:text-gray-100">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-300">Edit details, update progress view, and bypass enrollment when needed.</p>
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

      <div className="mb-4">
        <Link href="/admin/users" className="text-sm font-medium text-blue-600 hover:underline">
          ← Back to users
        </Link>
      </div>

      <AdminUserEditor
        user={JSON.parse(JSON.stringify(user))}
        courses={JSON.parse(JSON.stringify(courses))}
        enrollments={JSON.parse(JSON.stringify(enrollments))}
      />
    </div>
  );
}
