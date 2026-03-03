import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import GlossaryEntry from "@/models/GlossaryEntry";
import Link from "next/link";
import GlossaryClient from "./GlossaryClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CourseGlossaryPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect(`/login?callbackUrl=/courses/${id}/glossary`);

  await connectDB();

  const course = await Course.findById(id).lean();
  if (!course) redirect("/courses");

  const enrollment = await Enrollment.findOne({ course: id, student: session.user.id }).lean();

  if (session.user.role === "STUDENT" && !enrollment) {
    redirect(`/courses/${id}`);
  }

  const entries = await GlossaryEntry.find({ course: id })
    .populate("createdBy", "name surname")
    .sort({ term: 1, createdAt: -1 })
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
        <span className="text-gray-700 dark:text-gray-100">Glossary</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Glossary</h1>

      <GlossaryClient
        courseId={id}
        initialEntries={entries.map((entry) => ({
          _id: String(entry._id),
          term: entry.term,
          definition: entry.definition,
          category: entry.category,
          createdAt: new Date(entry.createdAt).toISOString(),
          createdBy: entry.createdBy as unknown as { name?: string; surname?: string },
        }))}
      />
    </div>
  );
}
