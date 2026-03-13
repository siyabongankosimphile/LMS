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
import Announcement from "@/models/Announcement";
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

  const nowMs = Date.now();
  const onlineThresholdDate = new Date(nowMs - 15 * 60 * 1000);

  const modulesPromise = CourseModule.find({ course: id }).sort({ order: 1 }).lean();
  const lessonsPromise = Lesson.find({ course: id }).sort({ order: 1 }).lean();
  const quizPromise = Quiz.findOne({ course: id }).lean();
  const assignmentsPromise = Assignment.find({ course: id })
    .sort({ dueAt: 1, createdAt: -1 })
    .lean();
  const discussionPostsPromise = DiscussionPost.find({ course: id })
    .populate("author", "name surname role")
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  const announcementsPromise = Announcement.find({ course: id })
    .populate("createdBy", "name surname")
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  const participantsCountPromise = Enrollment.countDocuments({ course: id });
  const onlineParticipantsPromise = Enrollment.find({
    course: id,
    updatedAt: { $gte: onlineThresholdDate },
  })
    .populate("student", "name surname role")
    .sort({ updatedAt: -1 })
    .limit(16)
    .lean();
  const enrollmentPromise = session?.user?.id
    ? Enrollment.findOne({ student: session.user.id, course: id }).lean()
    : Promise.resolve(null);
  const submissionsPromise =
    session?.user?.id && session.user.role === "STUDENT"
      ? AssignmentSubmission.find({
          course: id,
          student: session.user.id,
        })
          .select("assignment status")
          .lean()
      : Promise.resolve([] as Array<{ assignment: unknown; status: "SUBMITTED" | "GRADED" }>);

  const [
    modules,
    lessons,
    quiz,
    assignments,
    discussionPosts,
    announcements,
    participantsCount,
    onlineParticipants,
    enrollment,
    submissions,
  ] = await Promise.all([
    modulesPromise,
    lessonsPromise,
    quizPromise,
    assignmentsPromise,
    discussionPostsPromise,
    announcementsPromise,
    participantsCountPromise,
    onlineParticipantsPromise,
    enrollmentPromise,
    submissionsPromise,
  ]);

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
    attachment: assignment.attachment
      ? {
          url: assignment.attachment.url,
          key: assignment.attachment.key,
          name: assignment.attachment.name,
        }
      : undefined,
    submissionStatus:
      submissionByAssignment.get(String(assignment._id)) || "NOT_SUBMITTED",
  })) as Array<{
    _id: string;
    title: string;
    description?: string;
    dueAt?: string;
    attachment?: {
      url?: string;
      key?: string;
      name?: string;
    };
    submissionStatus: "NOT_SUBMITTED" | "SUBMITTED" | "GRADED";
  }>;

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

  if (enrollment && session?.user?.role === "STUDENT") {
    return (
      <CourseStudentView
        courseId={id}
        courseTitle={course.title}
        courseDescription={course.description}
        welcomeMessage={course.welcomeMessage}
        courseImage={course.thumbnail}
        facilitatorName={facilitator?.name || "Facilitator"}
        courseFormat={course.format || "WEEKLY"}
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
              key: resource.key,
            })),
          })),
        }))}
        assignments={assignmentsWithStatus}
        announcements={announcements.map((item) => {
          const creator = item.createdBy as unknown as { name?: string; surname?: string };
          return {
            _id: String(item._id),
            title: item.title,
            message: item.message,
            createdAt: new Date(item.createdAt).toISOString(),
            createdByName: `${creator?.name || "User"} ${creator?.surname || ""}`.trim(),
          };
        })}
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
        participantsCount={participantsCount + 1}
        upcomingEvents={upcomingEvents}
        recentActivity={recentActivity}
        participants={participants}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white mb-8">
        <h1 className="text-3xl font-bold mb-3">{course.title}</h1>
        <p className="text-blue-100 mb-4">{course.description}</p>
        {course.welcomeMessage && (
          <div className="mb-4 rounded-xl border border-blue-300/40 bg-white/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-100">Welcome Message</p>
            <p className="mt-1 text-sm text-blue-50 whitespace-pre-wrap">{course.welcomeMessage}</p>
          </div>
        )}
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
