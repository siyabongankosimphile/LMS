import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import Enrollment from "@/models/Enrollment";
import Certificate from "@/models/Certificate";
import Assignment from "@/models/Assignment";
import AssignmentSubmission from "@/models/AssignmentSubmission";
import "@/models/Course";
import Link from "next/link";
import DarkModeToggle from "@/components/DarkModeToggle";
import LogoutButton from "@/components/LogoutButton";
import DashboardMenu from "@/components/DashboardMenu";
import ProfileSettings from "./ProfileSettings";
import StudentDashboardClient from "./StudentDashboardClient";

function getCourseIdFromEnrollmentCourse(courseValue: unknown): string {
  if (!courseValue) return "";
  if (typeof courseValue === "string") return courseValue;
  if (typeof courseValue === "object") {
    const record = courseValue as { _id?: unknown };
    if (record._id) return String(record._id);
  }
  return "";
}

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

  const courseIds = enrollments
    .map((enrollment) => getCourseIdFromEnrollmentCourse(enrollment.course))
    .filter(Boolean);

  const assignments =
    courseIds.length > 0
      ? await Assignment.find({
          course: { $in: courseIds },
          dueAt: { $ne: null },
        })
          .sort({ dueAt: 1 })
          .lean()
      : [];

  const assignmentIds = assignments.map((assignment) => assignment._id);
  const submissions =
    assignmentIds.length > 0
      ? await AssignmentSubmission.find({
          assignment: { $in: assignmentIds },
          student: session.user.id,
        }).lean()
      : [];

  const submissionsByAssignment = new Map(
    submissions.map((submission) => [String(submission.assignment), submission])
  );

  const completed = enrollments.filter((e) => e.completed).length;
  const inProgress = enrollments.filter((e) => !e.completed).length;

  const courses = enrollments.map((enrollment) => {
    const course = enrollment.course as unknown as {
      _id: string;
      title: string;
      description?: string;
    };

    return {
      enrollmentId: String(enrollment._id),
      courseId: String(course._id),
      title: course.title,
      description: course.description,
      progressPercent: enrollment.progressPercent,
      completed: enrollment.completed,
      enrolledAt: new Date(enrollment.enrolledAt).toISOString(),
      completedAt: enrollment.completedAt
        ? new Date(enrollment.completedAt).toISOString()
        : undefined,
      quizScore: enrollment.quizScore,
    };
  });

  const timeline: Array<{
    assignmentId: string;
    courseId: string;
    courseTitle: string;
    assignmentTitle: string;
    dueAt: string;
    submissionStatus: "SUBMITTED" | "GRADED" | "NOT_SUBMITTED";
  }> = assignments
    .filter((assignment) => assignment.dueAt)
    .map((assignment) => {
      const submission = submissionsByAssignment.get(String(assignment._id));
      const matchingEnrollment = courses.find(
        (course) => course.courseId === String(assignment.course)
      );
      const submissionStatus =
        submission?.status === "SUBMITTED" || submission?.status === "GRADED"
          ? submission.status
          : "NOT_SUBMITTED";

      return {
        assignmentId: String(assignment._id),
        courseId: String(assignment.course),
        courseTitle: matchingEnrollment?.title || "Course",
        assignmentTitle: assignment.title,
        dueAt: new Date(assignment.dueAt as Date).toISOString(),
        submissionStatus,
      };
    });

  const badges = certificates.map((certificate) => {
    const course = certificate.course as unknown as { title: string };
    return {
      id: String(certificate._id),
      label: course?.title || "Course Achievement",
      issuedAt: new Date(certificate.issuedAt).toISOString(),
      fileUrl: certificate.fileUrl,
    };
  });

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
        <div className="bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-200 p-4 rounded-xl mb-6">
          <strong>Account pending approval.</strong> An admin will review your
          facilitator application.
        </div>
      )}

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
        <StudentDashboardClient
          courses={courses}
          timeline={timeline}
          badges={badges}
        />
      )}
    </div>
  );
}
