import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import CourseModule from "@/models/Module";
import Lesson from "@/models/Lesson";
import Quiz from "@/models/Quiz";
import Assignment from "@/models/Assignment";
import Announcement from "@/models/Announcement";
import Enrollment from "@/models/Enrollment";
import DiscussionPost from "@/models/DiscussionPost";
import FacilitatorCourseShell from "./FacilitatorCourseShell";

interface Props {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ created?: string }>;
}

export default async function FacilitatorCoursePage({ params, searchParams }: Props) {
  const { id } = await params;
  const resolvedSearchParams = (await searchParams) || {};
  const showCreatedNotice = resolvedSearchParams.created === "1";
  const nowMs = Date.now();
  const onlineThresholdDate = new Date(nowMs - 15 * 60 * 1000);

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

  const modulesPromise = CourseModule.find({ course: id })
    .sort({ order: 1 })
    .lean();

  const lessonsPromise = Lesson.find({ course: id })
    .sort({ order: 1 })
    .lean();

  const [modules, lessons, quiz, assignments, announcements, participantsCount, onlineParticipants, discussionPosts] = await Promise.all([
    modulesPromise,
    lessonsPromise,
    Quiz.findOne({ course: id }).lean(),
    Assignment.find({ course: id }).sort({ dueAt: 1, createdAt: -1 }).lean(),
    Announcement.find({ course: id })
      .populate("createdBy", "name surname")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
    Enrollment.countDocuments({ course: id }),
    Enrollment.find({
      course: id,
      updatedAt: { $gte: onlineThresholdDate },
    })
      .populate("student", "name surname role")
      .sort({ updatedAt: -1 })
      .limit(16)
      .lean(),
    DiscussionPost.find({ course: id })
      .populate("author", "name surname role")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
  ]);

  const assignmentsWithDue = assignments.map((assignment) => ({
    _id: String(assignment._id),
    title: assignment.title,
    dueAt: assignment.dueAt ? new Date(assignment.dueAt).toISOString() : undefined,
  }));

  const upcomingEvents = assignmentsWithDue
    .filter((assignment) => assignment.dueAt && new Date(assignment.dueAt).getTime() >= nowMs)
    .sort(
      (a, b) =>
        new Date(a.dueAt as string).getTime() - new Date(b.dueAt as string).getTime()
    )
    .slice(0, 12);

  const lessonActivity = lessons.slice(0, 10).map((lesson) => ({
    id: `lesson-${String(lesson._id)}`,
    label: "Lesson updated",
    detail: lesson.title,
    at: new Date(lesson.updatedAt || lesson.createdAt).toISOString(),
  }));

  const assignmentActivity = assignments.slice(0, 10).map((assignment) => ({
    id: `assignment-${String(assignment._id)}`,
    label: "Assignment posted",
    detail: assignment.title,
    at: new Date(assignment.createdAt).toISOString(),
  }));

  const forumActivity = discussionPosts.slice(0, 10).map((post) => {
    const author = post.author as unknown as { name?: string; surname?: string };
    return {
      id: `post-${String(post._id)}`,
      label: "Forum activity",
      detail: `${author?.name || "User"} ${author?.surname || ""}`.trim(),
      at: new Date(post.createdAt).toISOString(),
    };
  });

  const recentActivity = [...lessonActivity, ...assignmentActivity, ...forumActivity]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 12);

  const participants = onlineParticipants
    .map((participant) => {
      const student = participant.student as unknown as {
        _id: string;
        name?: string;
        surname?: string;
        role?: string;
      };
      return {
        id: String(student._id),
        name: `${student.name || "Student"} ${student.surname || ""}`.trim(),
        role: String(student.role || "STUDENT"),
      };
    })
    .slice(0, 12);

  return (
    <FacilitatorCourseShell
      courseId={id}
      course={JSON.parse(JSON.stringify(course))}
      modules={JSON.parse(JSON.stringify(modules))}
      lessons={JSON.parse(JSON.stringify(lessons))}
      quiz={quiz ? JSON.parse(JSON.stringify(quiz)) : null}
      assignments={JSON.parse(JSON.stringify(assignments))}
      announcements={JSON.parse(JSON.stringify(announcements))}
      upcomingEvents={upcomingEvents}
      recentActivity={recentActivity}
      participants={participants}
      participantsCount={participantsCount}
      showCreatedNotice={showCreatedNotice}
    />
  );
}
