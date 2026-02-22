import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import FacilitatorApprovals from "./FacilitatorApprovals";
import DarkModeToggle from "@/components/DarkModeToggle";
import LogoutButton from "@/components/LogoutButton";
import DashboardMenu from "@/components/DashboardMenu";

export default async function AdminFacilitatorsPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  await connectDB();

  const facilitators = await User.find({ role: "FACILITATOR" })
    .select("-password")
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div className="dashboard-theme max-w-7xl mx-auto px-4 py-8 text-gray-900 dark:text-gray-100">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Facilitator Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Approve or reject facilitator applications
          </p>
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
      <FacilitatorApprovals
        facilitators={JSON.parse(JSON.stringify(facilitators))}
      />
    </div>
  );
}
