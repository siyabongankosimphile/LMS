import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import DarkModeToggle from "@/components/DarkModeToggle";
import LogoutButton from "@/components/LogoutButton";
import DashboardMenu from "@/components/DashboardMenu";
import NewAdminUserForm from "./NewAdminUserForm";

export default async function AdminCreateUserPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="dashboard-theme mx-auto max-w-4xl px-4 py-8 text-gray-900 dark:text-gray-100">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create User</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-300">Create learner, facilitator, or admin accounts directly.</p>
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

      <NewAdminUserForm />
    </div>
  );
}
