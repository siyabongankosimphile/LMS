import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import DarkModeToggle from "@/components/DarkModeToggle";
import LogoutButton from "@/components/LogoutButton";
import DashboardMenu from "@/components/DashboardMenu";

export default async function AdminOperationsPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="dashboard-theme mx-auto max-w-7xl px-4 py-8 text-gray-900 dark:text-gray-100">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Operations</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-300">Complete handover checklist for rights and responsibilities.</p>
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

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">Rights</h2>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
            <li className="mt-1 font-semibold text-gray-900 dark:text-gray-100">Admin</li>
            <li><Link href="/admin/users/new" className="text-blue-600 hover:underline">Create users</Link> / <Link href="/admin/users" className="text-blue-600 hover:underline">Edit/Delete users</Link></li>
            <li><Link href="/admin/users" className="text-blue-600 hover:underline">Assign roles and permissions</Link></li>
            <li><Link href="/facilitator" className="text-blue-600 hover:underline">Create and manage courses</Link></li>
            <li><Link href="/admin/users" className="text-blue-600 hover:underline">Enroll users into courses</Link></li>
            <li><Link href="/admin/tools/preference" className="text-blue-600 hover:underline">Manage LMS settings</Link></li>
            <li><a href="/api/admin/reports/students" className="text-blue-600 hover:underline">Generate system reports</a></li>
            <li><Link href="/admin/certificates" className="text-blue-600 hover:underline">Manage certificates</Link></li>
            <li><Link href="/admin/activity" className="text-blue-600 hover:underline">Monitor overall system activity</Link></li>
            <li><Link href="/admin/tools/private-file" className="text-blue-600 hover:underline">Configure system security backups</Link></li>
            <li className="mt-4 border-t border-gray-200 pt-4 font-semibold text-gray-900 dark:border-slate-600 dark:text-gray-100">Facilitator (Instructor)</li>
            <li><Link href="/facilitator" className="text-blue-600 hover:underline">Create and manage courses</Link></li>
            <li>Upload learning materials (videos, PDFs, slides) in <Link href="/facilitator/courses/new" className="text-blue-600 hover:underline">course editor</Link></li>
            <li>Create assignments, quizzes, and exams via <Link href="/facilitator/courses/new" className="text-blue-600 hover:underline">course modules and quizzes</Link></li>
            <li>Grade learner submissions and assess quiz outcomes in <Link href="/facilitator" className="text-blue-600 hover:underline">facilitator dashboard</Link></li>
            <li>Provide feedback to learners during course delivery</li>
            <li>Monitor learner progress from the <Link href="/facilitator" className="text-blue-600 hover:underline">course management area</Link></li>
            <li>Manage course discussions/forums and learning interactions</li>
            <li>Communicate with learners for guidance and support</li>
            <li>Generate course-level performance reports</li>
            <li className="mt-4 border-t border-gray-200 pt-4 font-semibold text-gray-900 dark:border-slate-600 dark:text-gray-100">Learner (Student)</li>
            <li>Access assigned courses and learning materials from <Link href="/courses" className="text-blue-600 hover:underline">course catalog</Link> and <Link href="/dashboard" className="text-blue-600 hover:underline">dashboard</Link></li>
            <li>View lessons, videos, and documents in <Link href="/courses" className="text-blue-600 hover:underline">learning pages</Link></li>
            <li>Participate in discussions and forums where enabled</li>
            <li>Submit assignments and assessments</li>
            <li>Take quizzes and exams in enrolled courses</li>
            <li>View grades and feedback after assessment</li>
            <li>Track learning progress in <Link href="/dashboard" className="text-blue-600 hover:underline">progress dashboard</Link></li>
            <li>Download allowed learning resources</li>
            <li>Receive and download certificates after course completion via <Link href="/dashboard" className="text-blue-600 hover:underline">student dashboard</Link></li>
          </ul>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">Responsibilities</h2>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
            <li className="mt-1 font-semibold text-gray-900 dark:text-gray-100">Admin</li>
            <li>Maintain LMS system: <Link href="/admin" className="text-blue-600 hover:underline">Admin dashboard</Link></li>
            <li>Ensure system security: <Link href="/admin/tools/private-file" className="text-blue-600 hover:underline">Backup + restore files</Link></li>
            <li>Manage user access: <Link href="/admin/users" className="text-blue-600 hover:underline">Users and role updates</Link></li>
            <li>Provide technical support: <Link href="/admin/tools/message" className="text-blue-600 hover:underline">Message support tool</Link></li>
            <li>Ensure smooth operation: <Link href="/admin/activity" className="text-blue-600 hover:underline">Activity monitoring</Link></li>
            <li>Backup data: <a href="/api/admin/reports/students" className="text-blue-600 hover:underline">Export CSV</a> and <Link href="/admin/tools/private-file" className="text-blue-600 hover:underline">private backup upload</Link></li>
            <li className="mt-4 border-t border-gray-200 pt-4 font-semibold text-gray-900 dark:border-slate-600 dark:text-gray-100">Facilitator (Instructor)</li>
            <li>Provide quality learning materials aligned to course outcomes</li>
            <li>Support and guide learners throughout course delivery</li>
            <li>Assess learners fairly and consistently</li>
            <li>Provide timely, actionable feedback</li>
            <li>Monitor learner performance and intervene when needed</li>
            <li>Maintain clear course structure (modules, lessons, and assessments)</li>
            <li className="mt-4 border-t border-gray-200 pt-4 font-semibold text-gray-900 dark:border-slate-600 dark:text-gray-100">Learner (Student)</li>
            <li>Complete assigned courses and learning tasks on time</li>
            <li>Participate in learning activities and collaborative tasks</li>
            <li>Submit original work and avoid plagiarism</li>
            <li>Follow LMS and institution rules, policies, and academic standards</li>
            <li>Communicate respectfully with facilitators, admins, and peers</li>
            <li>Protect account credentials and use the platform responsibly</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
