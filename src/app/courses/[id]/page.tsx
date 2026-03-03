import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import CourseModule from "@/models/Module";
import Lesson from "@/models/Lesson";
import Quiz from "@/models/Quiz";
import Enrollment from "@/models/Enrollment";
import Assignment from "@/models/Assignment";
import AssignmentSubmission from "@/models/AssignmentSubmission";
import DiscussionPost from "@/models/DiscussionPost";
import EnrollForm from "./EnrollForm";
import Link from "next/link";
import CourseStudentView from "./CourseStudentView";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CourseDetailPage({ params }: Props) {
  const { id } = await params;
  await connectDB();
  const session = await getServerSession(authOptions);

  const course = await Course.findById(id)
    .populate("facilitator", "name")
    .lean();

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Course not found</h1>
      </div>
    );
  }

  const modules = await CourseModule.find({ course: id })
    .sort({ order: 1 })
    .lean();

  const lessons = await Lesson.find({ course: id })
    .sort({ order: 1 })
    .lean();

  const quiz = await Quiz.findOne({ course: id }).lean();

  const assignments = await Assignment.find({ course: id })
    .sort({ dueAt: 1, createdAt: -1 })
    .lean();

  const discussionPosts = await DiscussionPost.find({ course: id })
    .populate("author", "name surname role")
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const participants = await Enrollment.find({ course: id })
    .populate("student", "name surname role")
    .sort({ updatedAt: -1 })
    .lean();

  let enrollment = null;
  let submissions: Array<{ assignment: unknown; status: "SUBMITTED" | "GRADED" }> = [];
  if (session?.user?.id) {
    enrollment = await Enrollment.findOne({
      student: session.user.id,
      course: id,
    }).lean();

    if (session.user.role === "STUDENT") {
      submissions = await AssignmentSubmission.find({
        course: id,
        student: session.user.id,
      })
        .select("assignment status")
        .lean();
    }
  }

  const facilitator = course.facilitator as unknown as { name: string };
  const modulesWithLessons = modules.map((m) => ({
    ...m,
    lessons: lessons.filter((l) => String(l.module) === String(m._id)),
  }));

  const totalLessons = lessons.length;

  const submissionByAssignment = new Map(
    submissions.map((submission) => [String(submission.assignment), submission.status])
  );

  const assignmentsWithStatus = assignments.map((assignment) => ({
    _id: String(assignment._id),
    title: assignment.title,
    description: assignment.description,
    dueAt: assignment.dueAt ? new Date(assignment.dueAt).toISOString() : undefined,
    submissionStatus:
      submissionByAssignment.get(String(assignment._id)) || "NOT_SUBMITTED",
  })) as Array<{
    _id: string;
    title: string;
    description?: string;
    dueAt?: string;
    submissionStatus: "NOT_SUBMITTED" | "SUBMITTED" | "GRADED";
  }>;

  const nowMs = Date.now();
  const upcomingEvents = assignmentsWithStatus
    .filter((assignment) => assignment.dueAt && new Date(assignment.dueAt).getTime() >= nowMs)
    .sort(
      (a, b) =>
        new Date(a.dueAt as string).getTime() - new Date(b.dueAt as string).getTime()
    );

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

  const onlineThreshold = nowMs - 15 * 60 * 1000;
  const onlineUsers = participants
    .filter((participant) => {
      const lastSeen = new Date(
        (participant as { updatedAt?: Date | string; enrolledAt?: Date | string })
          .updatedAt || participant.enrolledAt
      ).getTime();
      return lastSeen >= onlineThreshold;
    })
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
    .slice(0, 8);

  if (enrollment && session?.user?.role === "STUDENT") {
    return (
      <CourseStudentView
        courseId={id}
        courseTitle={course.title}
        courseDescription={course.description}
        courseImage={course.thumbnail}
        facilitatorName={facilitator?.name || "Facilitator"}
        modules={modulesWithLessons.map((module) => ({
          _id: String(module._id),
          title: module.title,
          lessons: module.lessons.map((lesson) => ({
            _id: String(lesson._id),
            title: lesson.title,
            content: lesson.content,
            videoUrl: lesson.videoUrl,
            resources: (lesson.resources || []).map((resource) => ({
              name: resource.name,
              type: resource.type,
              url: resource.url,
            })),
          })),
        }))}
        assignments={assignmentsWithStatus}
        quiz={
          quiz
            ? {
                _id: String(quiz._id),
                title: quiz.title,
                attemptsAllowed: quiz.attemptsAllowed,
                timeLimitMinutes: quiz.timeLimitMinutes,
                questionCount: quiz.questions?.length || 0,
              }
            : null
        }
        progressPercent={enrollment.progressPercent}
        completedLessonsCount={(enrollment.completedLessons || []).length}
        totalLessons={totalLessons}
        participantsCount={participants.length + 1}
        upcomingEvents={upcomingEvents}
        recentActivity={recentActivity}
        onlineUsers={onlineUsers}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white mb-8">
        <h1 className="text-3xl font-bold mb-3">{course.title}</h1>
        <p className="text-blue-100 mb-4">{course.description}</p>
        <div className="flex items-center gap-4 text-sm text-blue-200">
          <span>👨‍🏫 {facilitator?.name || "Facilitator"}</span>
          <span>📚 {totalLessons} lessons</span>
          {quiz && <span>📝 Quiz included</span>}
        </div>
      </div>

      <div className="max-w-md bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {session?.user?.role === "STUDENT" ? (
          <EnrollForm courseId={id} />
        ) : !session ? (
          <div className="text-center">
            <p className="text-gray-500 text-sm mb-3">
              Sign in to enroll in this course
            </p>
            <Link
              href={`/login?callbackUrl=/courses/${id}`}
              className="block w-full bg-blue-600 text-white text-center py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Sign in to Enroll
            </Link>
          </div>
        ) : (
          <p className="text-sm text-gray-600">Only enrolled students can access this course space.</p>
        )}
      </div>
    </div>
  );
}
