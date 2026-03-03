import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import DiscussionPost from "@/models/DiscussionPost";
import Link from "next/link";
import ForumClient from "./ForumClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CourseForumPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect(`/login?callbackUrl=/courses/${id}/forum`);

  await connectDB();

  const course = await Course.findById(id).lean();
  if (!course) redirect("/courses");

  const enrollment = await Enrollment.findOne({ course: id, student: session.user.id }).lean();

  if (session.user.role === "STUDENT" && !enrollment) {
    redirect(`/courses/${id}`);
  }

  const posts = await DiscussionPost.find({ course: id })
    .populate("author", "name surname")
    .sort({ createdAt: 1 })
    .limit(200)
    .lean();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-4 text-sm text-gray-500 dark:text-gray-300">
        <Link href="/dashboard" className="hover:underline">Dashboard</Link>
        <span className="mx-2">&gt;</span>
        <Link href="/courses" className="hover:underline">My courses</Link>
        <span className="mx-2">&gt;</span>
        <Link href={`/courses/${id}`} className="hover:underline">{course.title}</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-gray-700 dark:text-gray-100">Forum</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Forum</h1>
      <ForumClient
        courseId={id}
        initialPosts={posts.map((post) => ({
          _id: String(post._id),
          message: post.message,
          createdAt: new Date(post.createdAt).toISOString(),
          parentPost: post.parentPost ? String(post.parentPost) : null,
          author: post.author as unknown as { name?: string; surname?: string },
        }))}
      />
    </div>
  );
}
