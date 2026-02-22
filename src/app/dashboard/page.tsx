import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import Enrollment from "@/models/Enrollment";
import Certificate from "@/models/Certificate";
import "@/models/Course";
import Link from "next/link";
import DarkModeToggle from "@/components/DarkModeToggle";
import LogoutButton from "@/components/LogoutButton";
import DashboardMenu from "@/components/DashboardMenu";
import ProfileSettings from "./ProfileSettings";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const role = session.user.role;
  const status = session.user.status;

  if (role === "ADMIN") redirect("/admin");
  if (role === "FACILITATOR") redirect("/facilitator");

  await connectDB();

  const [enrollments, certificates] = await Promise.all([
    Enrollment.find({ student: session.user.id })
      .populate("course", "title description")
      .sort({ enrolledAt: -1 })
      .lean(),
    Certificate.find({ student: session.user.id })
      .populate("course", "title")
      .sort({ issuedAt: -1 })
      .lean(),
  ]);

  const completed = enrollments.filter((e) => e.completed).length;
  const inProgress = enrollments.filter((e) => !e.completed).length;

  return (
    <div className="dashboard-theme max-w-7xl mx-auto px-4 py-8 text-gray-900 dark:text-gray-100">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {session.user.name}!
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">Here&apos;s your learning overview</p>
        </div>
        <div className="flex items-center gap-2">
          <DashboardMenu
            items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Courses", href: "/courses" },
            ]}
          />
          <ProfileSettings
            initialName={session.user.name || ""}
            initialEmail={session.user.email || ""}
            role={session.user.role}
            status={session.user.status}
          />
          <DarkModeToggle />
          <LogoutButton />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="text-3xl font-bold text-blue-600">{enrollments.length}</div>
          <div className="text-gray-600 dark:text-gray-300 text-sm mt-1">Enrolled Courses</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="text-3xl font-bold text-green-600">{completed}</div>
          <div className="text-gray-600 dark:text-gray-300 text-sm mt-1">Completed</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="text-3xl font-bold text-amber-600">{inProgress}</div>
          <div className="text-gray-600 dark:text-gray-300 text-sm mt-1">In Progress</div>
        </div>
      </div>

      {/* Pending approval notice for facilitators */}
      {status === "PENDING_APPROVAL" && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl mb-6">
          <strong>Account pending approval.</strong> An admin will review your
          facilitator application.
        </div>
      )}

      {/* My Courses */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">My Courses</h2>
          <Link
            href="/courses"
            className="text-blue-600 text-sm font-medium hover:underline"
          >
            Browse more →
          </Link>
        </div>

        {enrollments.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm border border-gray-100 dark:border-slate-700 text-center">
            <div className="text-4xl mb-4">📚</div>
            <p className="text-gray-500 dark:text-gray-300">You haven&apos;t enrolled in any courses yet.</p>
            <Link
              href="/courses"
              className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrollments.map((enrollment) => {
              const course = enrollment.course as unknown as { _id: string; title: string; description: string };
              const gradePercent =
                typeof enrollment.quizScore === "number"
                  ? enrollment.quizScore
                  : enrollment.progressPercent;

              return (
                <div
                  key={String(enrollment._id)}
                  className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5"
                >
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {course.title}
                  </h3>
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-300 mb-1">
                      <span>Progress</span>
                      <span>{enrollment.progressPercent}%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${enrollment.progressPercent}%` }}
                      />
                    </div>
                  </div>
                  {enrollment.completed ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-green-600 font-medium">
                          ✅ Completed
                        </span>
                        <span className="text-xs font-semibold text-indigo-600">
                          Grade: {gradePercent}%
                        </span>
                      </div>
                      <Link
                        href={`/courses/${course._id}/learn`}
                        className="text-sm text-blue-600 font-medium hover:underline"
                      >
                        Review →
                      </Link>
                    </div>
                  ) : (
                    <Link
                      href={`/courses/${course._id}/learn`}
                      className="text-sm text-blue-600 font-medium hover:underline"
                    >
                      Continue →
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Certificates */}
      {certificates.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🏆 My Certificates
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {certificates.map((cert) => {
              const course = cert.course as unknown as { title: string };
              return (
                <div
                  key={String(cert._id)}
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 rounded-xl border border-blue-100 dark:border-slate-600 p-5"
                >
                  <div className="text-2xl mb-2">📜</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {course.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-300 mb-3">
                    Issued{" "}
                    {new Date(cert.issuedAt).toLocaleDateString("en-ZA", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <a
                    href={cert.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 font-medium hover:underline"
                  >
                    Download PDF →
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
