import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import FacilitatorApprovals from "./FacilitatorApprovals";
import Link from "next/link";
import mongoose from "mongoose";
import DarkModeToggle from "@/components/DarkModeToggle";
import LogoutButton from "@/components/LogoutButton";
import DashboardMenu from "@/components/DashboardMenu";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function AdminFacilitatorsPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  const { q } = await searchParams;
  const query = (q || "").trim();

  await connectDB();

  const filter: Record<string, unknown> = { role: "FACILITATOR" };
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

  const facilitators = await User.find(filter)
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
            {query
              ? `Search results (${facilitators.length})`
              : "Approve or reject facilitator applications"}
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

      <form action="/admin/facilitators" method="GET" className="mb-6 rounded-xl border border-gray-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
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
              href="/admin/facilitators"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-gray-200 dark:hover:bg-slate-700"
            >
              Clear
            </Link>
          </div>
        </div>
      </form>

      <FacilitatorApprovals
        facilitators={JSON.parse(JSON.stringify(facilitators))}
      />
    </div>
  );
}
