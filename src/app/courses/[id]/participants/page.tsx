import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CourseParticipantsPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect(`/login?callbackUrl=/courses/${id}/participants`);

  await connectDB();

  const course = await Course.findById(id)
    .populate("facilitator", "name surname email role")
    .lean();
  if (!course) redirect("/courses");

  const enrollment = await Enrollment.findOne({
    course: id,
    student: session.user.id,
  }).lean();

  if (
    session.user.role === "STUDENT" &&
    !enrollment
  ) {
    redirect(`/courses/${id}`);
  }

  const participants = await Enrollment.find({ course: id })
    .populate("student", "name surname email role")
    .sort({ enrolledAt: -1 })
    .lean();

  const facilitator = course.facilitator as unknown as {
    name?: string;
    surname?: string;
    email?: string;
    role?: string;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-4 text-sm text-gray-500 dark:text-gray-300">
        <Link href="/dashboard" className="hover:underline">Dashboard</Link>
        <span className="mx-2">&gt;</span>
        <Link href="/courses" className="hover:underline">My courses</Link>
        <span className="mx-2">&gt;</span>
        <Link href={`/courses/${id}`} className="hover:underline">{course.title}</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-gray-700 dark:text-gray-100">Participants</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Participants</h1>

      <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 mb-4">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Teacher</p>
        <p className="text-sm text-gray-700 dark:text-gray-200">
          {facilitator?.name || "Facilitator"} {facilitator?.surname || ""}
        </p>
        {facilitator?.email && (
          <a href={`mailto:${facilitator.email}`} className="text-xs text-blue-600 hover:underline">
            Message by email
          </a>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">Students ({participants.length})</p>
        <div className="space-y-2">
          {participants.map((participant) => {
            const student = participant.student as unknown as {
              name?: string;
              surname?: string;
              email?: string;
            };

            return (
              <div key={String(participant._id)} className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-slate-700 px-3 py-2">
                <div>
                  <p className="text-sm text-gray-800 dark:text-gray-100">
                    {student?.name || "Student"} {student?.surname || ""}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-300">
                    Enrolled {new Date(participant.enrolledAt).toLocaleDateString("en-ZA")}
                  </p>
                </div>
                {student?.email && (
                  <a href={`mailto:${student.email}`} className="text-xs text-blue-600 hover:underline">
                    Message
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
