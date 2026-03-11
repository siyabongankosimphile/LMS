import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import Enrollment from "@/models/Enrollment";
import AssignmentSubmission from "@/models/AssignmentSubmission";
import Announcement from "@/models/Announcement";
import DiscussionPost from "@/models/DiscussionPost";
import "@/models/Course";
import Link from "next/link";
import MessagesClient from "./MessagesClient";

type NotificationItem = {
  id: string;
  type: "ANNOUNCEMENT" | "FORUM_REPLY" | "GRADED";
  title: string;
  detail: string;
  at: string;
  href: string;
};

function getCourseIdFromEnrollmentCourse(courseValue: unknown): string {
  if (!courseValue) return "";
  if (typeof courseValue === "string") return courseValue;
  if (typeof courseValue === "object") {
    const record = courseValue as { _id?: unknown };
    if (record._id) return String(record._id);
  }
  return "";
}

export default async function DashboardMessagesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/dashboard");

  await connectDB();

  const enrollments = await Enrollment.find({ student: session.user.id })
    .populate("course", "title")
    .sort({ enrolledAt: -1 })
    .lean();

  const courseIds = enrollments
    .map((enrollment) => getCourseIdFromEnrollmentCourse(enrollment.course))
    .filter(Boolean);

  const [announcements, gradedSubmissions, myDiscussionPosts] =
    courseIds.length > 0
      ? await Promise.all([
          Announcement.find({ course: { $in: courseIds } })
            .select("course title message createdAt")
            .sort({ createdAt: -1 })
            .limit(120)
            .lean(),
          AssignmentSubmission.find({
            course: { $in: courseIds },
            student: session.user.id,
            status: "GRADED",
          })
            .populate("assignment", "title")
            .sort({ gradedAt: -1, updatedAt: -1 })
            .limit(120)
            .lean(),
          DiscussionPost.find({
            course: { $in: courseIds },
            author: session.user.id,
          })
            .select("_id")
            .lean(),
        ])
      : [[], [], []];

  const myPostIds = myDiscussionPosts.map((post) => post._id);
  const forumReplies =
    myPostIds.length > 0
      ? await DiscussionPost.find({
          parentPost: { $in: myPostIds },
          author: { $ne: session.user.id },
        })
          .populate("author", "name surname")
          .sort({ createdAt: -1 })
          .limit(120)
          .lean()
      : [];

  const announcementNotifications: NotificationItem[] = announcements.map((item) => ({
    id: `note-announcement-${String(item._id)}`,
    type: "ANNOUNCEMENT",
    title: item.title,
    detail: item.message,
    at: new Date(item.createdAt).toISOString(),
    href: `/courses/${String(item.course)}/learn`,
  }));

  const forumNotifications: NotificationItem[] = forumReplies.map((reply) => {
    const author = reply.author as unknown as { name?: string; surname?: string };
    return {
      id: `note-reply-${String(reply._id)}`,
      type: "FORUM_REPLY",
      title: "Forum reply",
      detail: `${author?.name || "User"} ${author?.surname || ""}`.trim(),
      at: new Date(reply.createdAt).toISOString(),
      href: `/courses/${String(reply.course)}/forum`,
    };
  });

  const gradingNotifications: NotificationItem[] = gradedSubmissions.map((submission) => {
    const assignment = submission.assignment as unknown as { title?: string };
    return {
      id: `note-graded-${String(submission._id)}`,
      type: "GRADED",
      title: `Graded: ${assignment?.title || "Assignment"}`,
      detail:
        typeof submission.score === "number"
          ? `Score ${submission.score}%`
          : "Feedback available",
      at: new Date(submission.gradedAt || submission.updatedAt).toISOString(),
      href: `/courses/${String(submission.course)}/grades`,
    };
  });

  const notifications = [
    ...gradingNotifications,
    ...forumNotifications,
    ...announcementNotifications,
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return (
    <div className="dashboard-theme mx-auto w-full max-w-[1100px] px-3 py-5 text-gray-900 dark:text-gray-100 sm:px-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Messages</h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">Announcements, replies, and grading updates</p>
        </div>
        <Link href="/dashboard" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
          Back to dashboard
        </Link>
      </div>

      <MessagesClient notifications={notifications} />
    </div>
  );
}
