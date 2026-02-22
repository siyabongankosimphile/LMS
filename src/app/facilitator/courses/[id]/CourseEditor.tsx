"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Lesson {
  _id: string;
  title: string;
  videoUrl?: string;
  content?: string;
  module: string;
}

interface Module {
  _id: string;
  title: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

interface Quiz {
  _id: string;
  title: string;
  questions: QuizQuestion[];
  passMarkPercent: number;
}

interface Course {
  _id: string;
  title: string;
  description: string;
  published: boolean;
  passMarkPercent: number;
  enrollmentKeyHash: string;
}

interface Props {
  courseId: string;
  course: Course;
  modules: Module[];
  lessons: Lesson[];
  quiz: Quiz | null;
}

export default function CourseEditor({
  courseId,
  course: initialCourse,
  modules: initialModules,
  lessons: initialLessons,
  quiz: initialQuiz,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "content" | "quiz">(
    "overview"
  );
  const [course, setCourse] = useState(initialCourse);
  const [modules, setModules] = useState(initialModules);
  const [lessons, setLessons] = useState(initialLessons);
  const [quiz, setQuiz] = useState(initialQuiz);

  // Overview form state
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description);
  const [passMarkPercent, setPassMarkPercent] = useState(course.passMarkPercent);
  const [published, setPublished] = useState(course.published);
  const [enrollmentKey, setEnrollmentKey] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [saving, setSaving] = useState(false);

  // Module/Lesson state
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [addingModule, setAddingModule] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonVideo, setNewLessonVideo] = useState("");
  const [newLessonContent, setNewLessonContent] = useState("");
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [addingLesson, setAddingLesson] = useState(false);

  // Quiz state
  const [quizTitle, setQuizTitle] = useState(quiz?.title || "");
  const [quizPassMark, setQuizPassMark] = useState(quiz?.passMarkPercent || 70);
  const [questions, setQuestions] = useState<QuizQuestion[]>(
    quiz?.questions || []
  );
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [quizMsg, setQuizMsg] = useState("");

  async function saveOverview() {
    setSaving(true);
    setSaveMsg("");
    const body: Record<string, unknown> = {
      title,
      description,
      passMarkPercent,
      published,
    };
    if (enrollmentKey) body.enrollmentKey = enrollmentKey;

    const res = await fetch(`/api/facilitator/courses/${courseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      setCourse(data);
      setSaveMsg("Saved successfully!");
      setTimeout(() => setSaveMsg(""), 3000);
    }
  }

  async function addModule() {
    if (!newModuleTitle.trim()) return;
    setAddingModule(true);
    const res = await fetch(
      `/api/facilitator/courses/${courseId}/modules`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newModuleTitle, order: modules.length }),
      }
    );
    setAddingModule(false);
    if (res.ok) {
      const data = await res.json();
      setModules((prev) => [...prev, data]);
      setNewModuleTitle("");
    }
  }

  async function addLesson() {
    if (!newLessonTitle.trim() || !selectedModule) return;
    setAddingLesson(true);
    const res = await fetch(
      `/api/facilitator/courses/${courseId}/modules/${selectedModule}/lessons`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newLessonTitle,
          videoUrl: newLessonVideo || undefined,
          content: newLessonContent || undefined,
          order: lessons.filter((l) => l.module === selectedModule).length,
        }),
      }
    );
    setAddingLesson(false);
    if (res.ok) {
      const data = await res.json();
      setLessons((prev) => [...prev, data]);
      setNewLessonTitle("");
      setNewLessonVideo("");
      setNewLessonContent("");
    }
  }

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      { question: "", options: ["", "", "", ""], correctIndex: 0 },
    ]);
  }

  function updateQuestion(
    i: number,
    field: keyof QuizQuestion,
    value: string | number | string[]
  ) {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[i] = { ...updated[i], [field]: value };
      return updated;
    });
  }

  async function saveQuiz() {
    setSavingQuiz(true);
    setQuizMsg("");
    const res = await fetch(
      `/api/facilitator/courses/${courseId}/quizzes`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: quizTitle,
          questions,
          passMarkPercent: quizPassMark,
        }),
      }
    );
    setSavingQuiz(false);
    if (res.ok) {
      const data = await res.json();
      setQuiz(data);
      setQuizMsg("Quiz saved!");
      setTimeout(() => setQuizMsg(""), 3000);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                course.published
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {course.published ? "Published" : "Draft"}
            </span>
          </div>
        </div>
        <button
          onClick={() => router.push("/facilitator")}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          ← Back
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {(["overview", "content", "quiz"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === "overview" && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Enrollment Key (leave blank to keep current)
            </label>
            <input
              type="text"
              value={enrollmentKey}
              onChange={(e) => setEnrollmentKey(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter new key to change it"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quiz Pass Mark (%)
            </label>
            <input
              type="number"
              value={passMarkPercent}
              onChange={(e) => setPassMarkPercent(Number(e.target.value))}
              min={0}
              max={100}
              className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="pub"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="pub" className="text-sm text-gray-700">
              Published
            </label>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={saveOverview}
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            {saveMsg && (
              <span className="text-green-600 text-sm">{saveMsg}</span>
            )}
          </div>
        </div>
      )}

      {/* Content tab */}
      {activeTab === "content" && (
        <div className="space-y-6">
          {/* Add module */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Add Module</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Module title"
              />
              <button
                onClick={addModule}
                disabled={addingModule || !newModuleTitle.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {addingModule ? "Adding..." : "Add"}
              </button>
            </div>
          </div>

          {/* Modules list */}
          {modules.map((m) => (
            <div
              key={m._id}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden"
            >
              <div className="bg-gray-50 px-5 py-3 font-medium text-gray-800 flex items-center justify-between">
                <span>{m.title}</span>
                <button
                  onClick={() =>
                    setSelectedModule(
                      selectedModule === m._id ? null : m._id
                    )
                  }
                  className="text-blue-600 text-xs font-medium hover:underline"
                >
                  {selectedModule === m._id ? "Cancel" : "+ Add Lesson"}
                </button>
              </div>

              {/* Lessons */}
              <div className="divide-y divide-gray-50">
                {lessons
                  .filter((l) => l.module === m._id)
                  .map((l) => (
                    <div
                      key={l._id}
                      className="px-5 py-3 text-sm text-gray-700"
                    >
                      <div className="font-medium">{l.title}</div>
                      {l.videoUrl && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          🎬 Video: {l.videoUrl}
                        </div>
                      )}
                    </div>
                  ))}
              </div>

              {/* Add lesson form */}
              {selectedModule === m._id && (
                <div className="border-t border-gray-100 p-5 bg-blue-50 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700">
                    New Lesson
                  </h4>
                  <input
                    type="text"
                    value={newLessonTitle}
                    onChange={(e) => setNewLessonTitle(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Lesson title"
                  />
                  <input
                    type="url"
                    value={newLessonVideo}
                    onChange={(e) => setNewLessonVideo(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Video URL (optional)"
                  />
                  <textarea
                    value={newLessonContent}
                    onChange={(e) => setNewLessonContent(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Lesson content / notes (optional)"
                    rows={3}
                  />
                  <button
                    onClick={addLesson}
                    disabled={addingLesson || !newLessonTitle.trim()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {addingLesson ? "Adding..." : "Add Lesson"}
                  </button>
                </div>
              )}
            </div>
          ))}

          {modules.length === 0 && (
            <p className="text-gray-500 text-sm">
              No modules yet. Add your first module above.
            </p>
          )}
        </div>
      )}

      {/* Quiz tab */}
      {activeTab === "quiz" && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
          <h3 className="font-semibold text-gray-900">Course Quiz</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quiz Title
            </label>
            <input
              type="text"
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Final Assessment"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pass Mark (%)
            </label>
            <input
              type="number"
              value={quizPassMark}
              onChange={(e) => setQuizPassMark(Number(e.target.value))}
              min={0}
              max={100}
              className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-4">
            {questions.map((q, i) => (
              <div
                key={i}
                className="border border-gray-200 rounded-xl p-4 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <label className="text-sm font-medium text-gray-700">
                    Question {i + 1}
                  </label>
                  <button
                    onClick={() =>
                      setQuestions((prev) => prev.filter((_, j) => j !== i))
                    }
                    className="text-red-500 text-xs hover:underline"
                  >
                    Remove
                  </button>
                </div>
                <input
                  type="text"
                  value={q.question}
                  onChange={(e) => updateQuestion(i, "question", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Question text"
                />
                <div className="space-y-2">
                  {q.options.map((opt, j) => (
                    <div key={j} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${i}`}
                        checked={q.correctIndex === j}
                        onChange={() => updateQuestion(i, "correctIndex", j)}
                        className="text-blue-600"
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const newOptions = [...q.options];
                          newOptions[j] = e.target.value;
                          updateQuestion(i, "options", newOptions);
                        }}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`Option ${j + 1}${q.correctIndex === j ? " (correct)" : ""}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addQuestion}
            className="border border-blue-300 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
          >
            + Add Question
          </button>

          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={saveQuiz}
              disabled={savingQuiz || !quizTitle || questions.length === 0}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {savingQuiz ? "Saving..." : quiz ? "Update Quiz" : "Create Quiz"}
            </button>
            {quizMsg && (
              <span className="text-green-600 text-sm">{quizMsg}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
