import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import ParticipantsManager from "./ParticipantsManager";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FacilitatorParticipantsPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !["FACILITATOR", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  await connectDB();

  const course = await Course.findById(id).lean();
  if (!course) redirect("/facilitator");

  if (
    session.user.role !== "ADMIN" &&
    String(course.facilitator) !== session.user.id
  ) {
    redirect("/facilitator");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Participants</h1>
          <p className="text-sm text-gray-500">{course.title}</p>
        </div>
        <Link href={`/facilitator/courses/${id}`} className="text-sm text-blue-600 hover:underline">
          Back to course
        </Link>
      </div>

      <ParticipantsManager courseId={id} />
    </div>
  );
}
