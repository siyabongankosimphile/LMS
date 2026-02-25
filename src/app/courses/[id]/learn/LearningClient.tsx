"use client";

import { useCallback, useEffect, useState } from "react";

interface Lesson {
  _id: string;
  title: string;
  videoUrl?: string;
  content?: string;
  resources?: Array<{ name: string; type: string; url: string }>;
}

interface Module {
  _id: string;
  title: string;
}

interface QuizQuestion {
  type:
    | "MCQ"
    | "DESCRIPTIVE"
    | "MULTIPLE_CHOICE"
    | "TRUE_FALSE"
    | "SHORT_ANSWER"
    | "MATCHING"
    | "ESSAY";
  name?: string;
  question: string;
  marks?: number;
  options?: string[];
  correctIndex?: number;
  acceptedAnswers?: string[];
  matchingPairs?: Array<{ left: string; right: string }>;
  selfMarkingGuidance?: string;
  feedback?: string;
}

interface Quiz {
  _id: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  passMarkPercent: number;
  openAt?: string;
  closeAt?: string;
  timeLimitMinutes?: number;
  attemptsAllowed?: number;
  questionsPerPage?: number;
  reviewOptions?: {
    showMarks?: boolean;
    showCorrectAnswers?: boolean;
    showFeedback?: boolean;
  };
}

interface Enrollment {
  completedLessons: string[];
  progressPercent: number;
  completed: boolean;
  quizScore?: number;
  quizPassed?: boolean;
  quizAttempts?: number;
}

interface Certificate {
  _id: string;
  fileUrl: string;
}

interface AssignmentSubmission {
  _id: string;
  content?: string;
  attachment?: {
    url: string;
    name: string;
  };
  status: "SUBMITTED" | "GRADED";
  score?: number;
  feedback?: string;
}

interface Assignment {
  _id: string;
  title: string;
  description?: string;
  dueAt?: string;
  attachment?: {
    url: string;
    name: string;
  };
  mySubmission?: AssignmentSubmission | null;
}

interface DiscussionPost {
  _id: string;
  message: string;
  authorRole: "ADMIN" | "FACILITATOR" | "STUDENT";
  createdAt: string;
  author?: { name?: string; surname?: string };
}

interface Props {
  courseId: string;
  course: { title: string };
  modules: Module[];
  lessons: Lesson[];
  quiz: Quiz | null;
  enrollment: Enrollment;
  certificate: Certificate | null;
}

export default function LearningClient({
  courseId,
  course,
  modules,
  lessons,
  quiz,
  enrollment: initialEnrollment,
  certificate: initialCertificate,
}: Props) {
  const [enrollment, setEnrollment] = useState(initialEnrollment);
  const [certificate, setCertificate] = useState(initialCertificate);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(
    lessons[0] || null
  );
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, unknown>>({});
  const [quizStartedAt, setQuizStartedAt] = useState<string>("");
  const [quizPage, setQuizPage] = useState(1);
  const [quizResult, setQuizResult] = useState<{
    scorePercent: number;
    passed: boolean;
    correct: number;
    total: number;
    passMarkPercent: number;
    attemptsUsed?: number;
    attemptsAllowed?: number;
    questionResults?: Array<{
      index: number;
      question: string;
      isCorrect: boolean;
      marksEarned?: number;
      maxMarks?: number;
      correctAnswer?: unknown;
      feedback?: string | null;
    }>;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [quizSubmitMsg, setQuizSubmitMsg] = useState("");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentDrafts, setAssignmentDrafts] = useState<Record<string, string>>(
    {}
  );
  const [assignmentFiles, setAssignmentFiles] = useState<Record<string, File | null>>({});
  const [assignmentFileNames, setAssignmentFileNames] = useState<Record<string, string>>(
    {}
  );
  const [submittingAssignmentId, setSubmittingAssignmentId] = useState("");
  const [discussionPosts, setDiscussionPosts] = useState<DiscussionPost[]>([]);
  const [discussionMessage, setDiscussionMessage] = useState("");
  const [postingDiscussion, setPostingDiscussion] = useState(false);

  const completedIds = new Set(enrollment.completedLessons || []);

  const loadAssignments = useCallback(async () => {
    const res = await fetch(`/api/courses/${courseId}/assignments`);
    if (!res.ok) return;
    const data = await res.json();
    const fetched = (data.assignments || []) as Assignment[];
    setAssignments(fetched);
    const nextDrafts: Record<string, string> = {};
    const nextFileNames: Record<string, string> = {};
    fetched.forEach((item) => {
      nextDrafts[item._id] = item.mySubmission?.content || "";
      nextFileNames[item._id] = item.mySubmission?.attachment?.name || "";
    });
    setAssignmentDrafts(nextDrafts);
    setAssignmentFileNames(nextFileNames);
    setAssignmentFiles({});
  }, [courseId]);

  const loadDiscussion = useCallback(async () => {
    const res = await fetch(`/api/courses/${courseId}/discussion`);
    if (!res.ok) return;
    const data = await res.json();
    setDiscussionPosts(data.posts || []);
  }, [courseId]);

  useEffect(() => {
    loadAssignments();
    loadDiscussion();
  }, [loadAssignments, loadDiscussion]);

  async function markComplete(lessonId: string) {
    const res = await fetch(`/api/enrollments/${courseId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId }),
    });
    if (res.ok) {
      const data = await res.json();
      setEnrollment((prev) => ({
        ...prev,
        completedLessons: data.completedLessons,
        progressPercent: data.progressPercent,
        completed: data.completed,
      }));
      if (data.completed) {
        // Fetch certificate
        const certRes = await fetch(`/api/courses/${courseId}`);
        if (certRes.ok) {
          const certData = await certRes.json();
          if (certData.certificate) setCertificate(certData.certificate);
        }
      }
    }
  }

  async function submitQuiz() {
    if (!quiz) return;

    setQuizSubmitMsg("");
    setSubmitting(true);
    const startedAt = quizStartedAt || new Date().toISOString();
    if (!quizStartedAt) {
      setQuizStartedAt(startedAt);
    }
    const answers = quiz.questions.map((_, i) => quizAnswers[i] ?? null);
    const res = await fetch(`/api/quizzes/${quiz._id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers, courseId, startedAt }),
    });
    setSubmitting(false);
    if (res.ok) {
      const data = await res.json();
      setQuizResult(data);
      setEnrollment((prev) => ({
        ...prev,
        quizScore: data.scorePercent,
        quizPassed: data.passed,
        completed: data.completed,
        quizAttempts: data.attemptsUsed ?? prev.quizAttempts,
      }));
      return;
    }

    let errorMessage = "Failed to submit quiz.";
    try {
      const errorData = await res.json();
      if (typeof errorData?.error === "string" && errorData.error.trim()) {
        errorMessage = errorData.error;
      }
    } catch {
      // no-op
    }
    setQuizSubmitMsg(errorMessage);
  }

  async function submitAssignment(assignmentId: string) {
    const content = (assignmentDrafts[assignmentId] || "").trim();
    const file = assignmentFiles[assignmentId];
    if (!content && !file) return;

    setSubmittingAssignmentId(assignmentId);
    try {
      let attachment:
        | {
            url: string;
            key: string;
            name: string;
            contentType?: string;
            size?: number;
          }
        | undefined;

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("context", `assignment-submissions/${courseId}/${assignmentId}`);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) return;
        const uploadData = await uploadRes.json();
        attachment = {
          url: uploadData.url,
          key: uploadData.key,
          name: uploadData.name,
          contentType: file.type,
          size: file.size,
        };
      }

      const res = await fetch(`/api/assignments/${assignmentId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, attachment }),
      });
      if (res.ok) {
        await loadAssignments();
      }
    } finally {
      setSubmittingAssignmentId("");
    }
  }

  async function postDiscussion() {
    const message = discussionMessage.trim();
    if (!message) return;

    setPostingDiscussion(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/discussion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (res.ok) {
        setDiscussionMessage("");
        await loadDiscussion();
      }
    } finally {
      setPostingDiscussion(false);
    }
  }

  // Build module->lessons map properly
  const lessonsByModule: Record<string, Lesson[]> = {};
  for (const l of lessons) {
    const lessonAny = l as Lesson & { module?: string };
    const moduleId = lessonAny.module || "";
    if (!lessonsByModule[moduleId]) lessonsByModule[moduleId] = [];
    lessonsByModule[moduleId].push(l);
  }

  const allQuestionsAnswered =
    quiz !== null &&
    quiz.questions.every((question, index) => {
      const answer = quizAnswers[index];
      const type = question.type;

      if (type === "MCQ" || type === "MULTIPLE_CHOICE" || type === "TRUE_FALSE") {
        return typeof answer === "number";
      }

      if (type === "SHORT_ANSWER" || type === "DESCRIPTIVE" || type === "ESSAY") {
        return typeof answer === "string" && answer.trim().length > 0;
      }

      if (type === "MATCHING") {
        if (!answer || typeof answer !== "object") return false;
        const map = answer as Record<string, string>;
        const pairs = question.matchingPairs || [];
        return pairs.length > 0 && pairs.every((pair) => !!String(map[pair.left] || "").trim());
      }

      return false;
    });

  const questionsPerPage = Math.max(1, quiz?.questionsPerPage || 5);
  const totalQuizPages = quiz ? Math.ceil(quiz.questions.length / questionsPerPage) : 1;
  const pageStartIndex = (quizPage - 1) * questionsPerPage;
  const pageEndIndex = pageStartIndex + questionsPerPage;
  const pagedQuestions = quiz ? quiz.questions.slice(pageStartIndex, pageEndIndex) : [];

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-72 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-sm truncate">
            {course.title}
          </h2>
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{enrollment.progressPercent}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all"
                style={{ width: `${enrollment.progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="p-2">
          {modules.map((m) => (
            <div key={m._id} className="mb-3">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {m.title}
              </div>
              {(lessonsByModule[m._id] || []).map((l) => (
                <button
                  key={l._id}
                  onClick={() => {
                    setActiveLesson(l);
                    setShowQuiz(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                    activeLesson?._id === l._id
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-xs">
                    {completedIds.has(l._id) ? "✅" : "○"}
                  </span>
                  <span className="truncate">{l.title}</span>
                </button>
              ))}
            </div>
          ))}

          {quiz && (
            <button
              onClick={() => {
                setShowQuiz(true);
                setQuizPage(1);
                setQuizStartedAt(new Date().toISOString());
                setQuizSubmitMsg("");
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors mt-2 ${
                showQuiz
                  ? "bg-purple-50 text-purple-700"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="text-xs">📝</span>
              <span>{quiz.title}</span>
              {enrollment.quizPassed && (
                <span className="ml-auto text-xs text-green-600">✅</span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {showQuiz && quiz ? (
          <div className="max-w-3xl mx-auto px-6 py-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{quiz.title}</h2>
            {quiz.description && (
              <p className="text-sm text-gray-600 mb-2">{quiz.description}</p>
            )}
            <p className="text-gray-500 text-sm mb-6">
              Pass mark: {quiz.passMarkPercent}%
            </p>
            <div className="mb-6 flex flex-wrap gap-3 text-xs text-gray-600">
              {quiz.timeLimitMinutes && (
                <span className="rounded-full bg-gray-100 px-3 py-1">
                  Time limit: {quiz.timeLimitMinutes} min
                </span>
              )}
              <span className="rounded-full bg-gray-100 px-3 py-1">
                Attempts: {enrollment.quizAttempts || 0}/{quiz.attemptsAllowed || 1}
              </span>
            </div>

            {quizResult ? (
              <div
                className={`rounded-xl p-6 mb-6 ${
                  quizResult.passed
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <div className="text-2xl font-bold mb-2">
                  {quizResult.passed ? "🎉 Passed!" : "❌ Not passed"}
                </div>
                <p className="text-gray-700">
                  You scored {quizResult.correct}/{quizResult.total} (
                  {quizResult.scorePercent}%). Pass mark:{" "}
                  {quizResult.passMarkPercent}%.
                </p>
                {typeof quizResult.attemptsUsed === "number" && (
                  <p className="mt-1 text-xs text-gray-600">
                    Attempts used: {quizResult.attemptsUsed}/{quizResult.attemptsAllowed || 1}
                  </p>
                )}
                {Array.isArray(quizResult.questionResults) && quizResult.questionResults.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {quizResult.questionResults.map((result, idx) => (
                      <div key={idx} className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
                        <p className="font-medium text-gray-900">Q{result.index + 1}. {result.question}</p>
                        <p className="text-xs text-gray-600">
                          {result.isCorrect ? "Correct" : "Incorrect"}
                          {typeof result.marksEarned === "number" && typeof result.maxMarks === "number"
                            ? ` • Marks: ${result.marksEarned}/${result.maxMarks}`
                            : ""}
                        </p>
                        {result.correctAnswer !== undefined && result.correctAnswer !== null && (
                          <p className="mt-1 text-xs text-gray-700">
                            Correct answer: {typeof result.correctAnswer === "string"
                              ? result.correctAnswer
                              : JSON.stringify(result.correctAnswer)}
                          </p>
                        )}
                        {result.feedback && (
                          <p className="mt-1 text-xs text-indigo-700">Feedback: {result.feedback}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {!quizResult.passed && (
                  <button
                    onClick={() => {
                      setQuizResult(null);
                      setQuizAnswers({});
                      setQuizStartedAt(new Date().toISOString());
                      setQuizPage(1);
                    }}
                    className="mt-3 text-blue-600 text-sm font-medium hover:underline"
                  >
                    Try again
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {pagedQuestions.map((q, localIndex) => {
                  const i = pageStartIndex + localIndex;
                  const matchingPairs = q.matchingPairs || [];
                  const matchingAnswer =
                    quizAnswers[i] && typeof quizAnswers[i] === "object"
                      ? (quizAnswers[i] as Record<string, string>)
                      : {};

                  return (
                  <div key={i} className="bg-white rounded-xl border border-gray-100 p-5">
                    <p className="font-medium text-gray-900 mb-4">
                      {i + 1}. {q.question}
                    </p>
                    {(q.type === "MCQ" || q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE") && (
                      <div className="space-y-2">
                        {(q.type === "TRUE_FALSE" ? ["True", "False"] : q.options || []).map((opt, j) => (
                          <label
                            key={j}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              quizAnswers[i] === j
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`q-${i}`}
                              value={j}
                              checked={quizAnswers[i] === j}
                              onChange={() =>
                                setQuizAnswers((prev) => ({ ...prev, [i]: j }))
                              }
                              className="text-blue-600"
                            />
                            <span className="text-sm text-gray-700">{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {q.type === "SHORT_ANSWER" && (
                      <input
                        type="text"
                        value={typeof quizAnswers[i] === "string" ? (quizAnswers[i] as string) : ""}
                        onChange={(e) =>
                          setQuizAnswers((prev) => ({ ...prev, [i]: e.target.value }))
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        placeholder="Type your short answer"
                      />
                    )}

                    {q.type === "MATCHING" && (
                      <div className="space-y-2">
                        {matchingPairs.map((pair, pairIdx) => (
                          <div key={pairIdx} className="grid gap-2 sm:grid-cols-2">
                            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                              {pair.left}
                            </div>
                            <select
                              value={matchingAnswer[pair.left] || ""}
                              onChange={(e) =>
                                setQuizAnswers((prev) => ({
                                  ...prev,
                                  [i]: {
                                    ...(prev[i] && typeof prev[i] === "object"
                                      ? (prev[i] as Record<string, string>)
                                      : {}),
                                    [pair.left]: e.target.value,
                                  },
                                }))
                              }
                              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            >
                              <option value="">Select match</option>
                              {matchingPairs.map((optionPair, optionIndex) => (
                                <option key={optionIndex} value={optionPair.right}>
                                  {optionPair.right}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    )}

                    {(q.type === "DESCRIPTIVE" || q.type === "ESSAY") && (
                      <div>
                        {q.selfMarkingGuidance && (
                          <p className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                            {q.selfMarkingGuidance}
                          </p>
                        )}
                        <textarea
                          rows={4}
                          value={typeof quizAnswers[i] === "string" ? (quizAnswers[i] as string) : ""}
                          onChange={(e) =>
                            setQuizAnswers((prev) => ({ ...prev, [i]: e.target.value }))
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          placeholder="Write your answer"
                        />
                      </div>
                    )}
                  </div>
                )})}

                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setQuizPage((prev) => Math.max(1, prev - 1))}
                    disabled={quizPage === 1}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-gray-500">
                    Page {quizPage} of {totalQuizPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuizPage((prev) => Math.min(totalQuizPages, prev + 1))}
                    disabled={quizPage === totalQuizPages}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>

                <button
                  onClick={submitQuiz}
                  disabled={submitting || !allQuestionsAnswered}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? "Submitting..." : "Submit Quiz"}
                </button>
                {quizSubmitMsg && (
                  <p className="text-sm text-red-600">{quizSubmitMsg}</p>
                )}
              </div>
            )}

            {enrollment.completed && certificate && (
              <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <div className="text-2xl mb-2">🏆</div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Certificate earned!
                </h3>
                <a
                  href={certificate.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 text-sm font-medium hover:underline"
                >
                  Download your certificate →
                </a>
              </div>
            )}
          </div>
        ) : activeLesson ? (
          <div className="max-w-4xl mx-auto px-6 py-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {activeLesson.title}
            </h2>

            {activeLesson.videoUrl && (
              <div className="mb-6 aspect-video bg-black rounded-xl overflow-hidden">
                <iframe
                  src={activeLesson.videoUrl}
                  className="w-full h-full"
                  allowFullScreen
                  title={activeLesson.title}
                />
              </div>
            )}

            {activeLesson.content && (
              <div className="prose max-w-none mb-6 text-gray-700">
                <p>{activeLesson.content}</p>
              </div>
            )}

            {activeLesson.resources && activeLesson.resources.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Resources</h3>
                <div className="space-y-2">
                  {activeLesson.resources.map((r, i) => (
                    <a
                      key={i}
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:underline text-sm"
                    >
                      <span>{r.type === "file" ? "📎" : "🔗"}</span>
                      {r.name}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="mb-3 font-semibold text-gray-900">Assignments</h3>
              {assignments.length === 0 ? (
                <p className="text-sm text-gray-500">No assignments available for this course yet.</p>
              ) : (
                <div className="space-y-3">
                  {assignments.map((assignment) => (
                    <div key={assignment._id} className="rounded-lg border border-gray-200 p-3">
                      <p className="font-medium text-gray-900">{assignment.title}</p>
                      {assignment.description && (
                        <p className="mt-1 text-sm text-gray-600">{assignment.description}</p>
                      )}
                      {assignment.dueAt && (
                        <p className="mt-1 text-xs text-gray-500">
                          Due: {new Date(assignment.dueAt).toLocaleDateString()}
                        </p>
                      )}
                      {assignment.attachment?.url && (
                        <a
                          href={assignment.attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-block text-xs text-blue-600 hover:underline"
                        >
                          Assignment file: {assignment.attachment.name}
                        </a>
                      )}

                      <textarea
                        rows={3}
                        value={assignmentDrafts[assignment._id] || ""}
                        onChange={(e) =>
                          setAssignmentDrafts((prev) => ({
                            ...prev,
                            [assignment._id]: e.target.value,
                          }))
                        }
                        placeholder="Write your submission"
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />

                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp,.zip"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setAssignmentFiles((prev) => ({
                            ...prev,
                            [assignment._id]: file,
                          }));
                          setAssignmentFileNames((prev) => ({
                            ...prev,
                            [assignment._id]: file?.name || assignment.mySubmission?.attachment?.name || "",
                          }));
                        }}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Optional. Upload file and/or text. Allowed: PDF, DOC, DOCX, TXT, PNG, JPG, WEBP, ZIP. Max 50MB.
                      </p>
                      {assignmentFileNames[assignment._id] && (
                        <p className="mt-1 text-xs text-gray-500">
                          Selected file: {assignmentFileNames[assignment._id]}
                        </p>
                      )}

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => submitAssignment(assignment._id)}
                          disabled={submittingAssignmentId === assignment._id}
                          className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {submittingAssignmentId === assignment._id
                            ? "Submitting..."
                            : "Submit Assignment"}
                        </button>
                        {assignment.mySubmission && (
                          <span className="text-xs text-gray-600">
                            Status: {assignment.mySubmission.status}
                            {typeof assignment.mySubmission.score === "number"
                              ? ` • Score: ${assignment.mySubmission.score}%`
                              : ""}
                          </span>
                        )}
                      </div>

                      {assignment.mySubmission?.feedback && (
                        <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                          Feedback: {assignment.mySubmission.feedback}
                        </p>
                      )}
                      {assignment.mySubmission?.attachment?.url && (
                        <a
                          href={assignment.mySubmission.attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-block text-xs text-blue-600 hover:underline"
                        >
                          Your uploaded file: {assignment.mySubmission.attachment.name}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="mb-3 font-semibold text-gray-900">Discussion</h3>
              <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50 p-3">
                {discussionPosts.length === 0 ? (
                  <p className="text-sm text-gray-500">No discussion posts yet.</p>
                ) : (
                  discussionPosts.map((post) => (
                    <div key={post._id} className="rounded-lg bg-white p-2">
                      <p className="text-xs font-semibold text-gray-700">
                        {(post.author?.name || "User") + " " + (post.author?.surname || "")} • {post.authorRole}
                      </p>
                      <p className="text-sm text-gray-700">{post.message}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={discussionMessage}
                  onChange={(e) => setDiscussionMessage(e.target.value)}
                  placeholder="Write a message"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={postDiscussion}
                  disabled={postingDiscussion}
                  className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {postingDiscussion ? "Posting..." : "Post"}
                </button>
              </div>
            </div>

            {!completedIds.has(activeLesson._id) ? (
              <button
                onClick={() => markComplete(activeLesson._id)}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Mark as Complete ✓
              </button>
            ) : (
              <div className="text-green-600 font-medium text-sm">
                ✅ Lesson completed
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a lesson to start learning
          </div>
        )}
      </div>
    </div>
  );
}
