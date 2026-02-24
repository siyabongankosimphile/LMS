"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Lesson {
  _id: string;
  title: string;
  videoUrl?: string;
  content?: string;
  module: string;
  resources?: Array<{
    name: string;
    type: "file" | "link";
    url: string;
    key?: string;
  }>;
}

interface Module {
  _id: string;
  title: string;
}

interface QuizQuestion {
  type:
    | "MULTIPLE_CHOICE"
    | "TRUE_FALSE"
    | "SHORT_ANSWER"
    | "MATCHING"
    | "ESSAY";
  name?: string;
  question: string;
  marks: number;
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
  gradeCategory?: string;
  attemptsAllowed?: number;
  questionsPerPage?: number;
  reviewOptions?: {
    showMarks?: boolean;
    showCorrectAnswers?: boolean;
    showFeedback?: boolean;
  };
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

          <h3 className="font-semibold text-gray-900">Course Quiz</h3>

          <div className="space-y-3 rounded-lg border border-gray-200 p-4">
            <h4 className="text-sm font-semibold text-gray-800">Basic Settings</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Example: Module 1 Quiz"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={quizDescription}
                onChange={(e) => setQuizDescription(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Instructions for students"
              />
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-gray-200 p-4">
            <h4 className="text-sm font-semibold text-gray-800">Timing Settings</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Open quiz
                </label>
                <input
                  type="datetime-local"
                  value={quizOpenAt}
                  onChange={(e) => setQuizOpenAt(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Close quiz
                </label>
                <input
                  type="datetime-local"
                  value={quizCloseAt}
                  onChange={(e) => setQuizCloseAt(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time limit (minutes)
              </label>
              <input
                type="number"
                value={quizTimeLimitMinutes}
                onChange={(e) => setQuizTimeLimitMinutes(Number(e.target.value))}
                min={1}
                className="w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-gray-200 p-4">
            <h4 className="text-sm font-semibold text-gray-800">Grade Settings</h4>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grade category
                </label>
                <input
                  type="text"
                  value={quizGradeCategory}
                  onChange={(e) => setQuizGradeCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attempts allowed
                </label>
                <input
                  type="number"
                  value={quizAttemptsAllowed}
                  onChange={(e) => setQuizAttemptsAllowed(Number(e.target.value))}
                  min={1}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Passing grade (%)
                </label>
                <input
                  type="number"
                  value={quizPassMark}
                  onChange={(e) => setQuizPassMark(Number(e.target.value))}
                  min={0}
                  max={100}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-gray-200 p-4">
            <h4 className="text-sm font-semibold text-gray-800">Layout</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Questions per page
              </label>
              <input
                type="number"
                value={quizQuestionsPerPage}
                onChange={(e) => setQuizQuestionsPerPage(Number(e.target.value))}
                min={1}
                className="w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-gray-200 p-4">
            <h4 className="text-sm font-semibold text-gray-800">Review Options</h4>
            <div className="flex flex-wrap gap-5">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={quizReviewOptions.showMarks}
                  onChange={(e) =>
                    setQuizReviewOptions((prev) => ({
                      ...prev,
                      showMarks: e.target.checked,
                    }))
                  }
                />
                Marks
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={quizReviewOptions.showCorrectAnswers}
                  onChange={(e) =>
                    setQuizReviewOptions((prev) => ({
                      ...prev,
                      showCorrectAnswers: e.target.checked,
                    }))
                  }
                />
                Correct answers
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={quizReviewOptions.showFeedback}
                  onChange={(e) =>
                    setQuizReviewOptions((prev) => ({
                      ...prev,
                      showFeedback: e.target.checked,
                    }))
                  }
                />
                Feedback
              </label>
            </div>
          </div>

          <div className="space-y-4 rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-800">Edit Quiz Questions</h4>
              <button
                onClick={addQuestion}
                className="border border-blue-300 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-50"
              >
                Add → New question
              </button>
            </div>
  courseId,
  const [newLessonVideo, setNewLessonVideo] = useState("");
  const [newLessonContent, setNewLessonContent] = useState("");
  const [newLessonSlideFile, setNewLessonSlideFile] = useState<File | null>(null);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [addingLesson, setAddingLesson] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editLessonTitle, setEditLessonTitle] = useState("");
  const [editLessonVideo, setEditLessonVideo] = useState("");
  const [editLessonContent, setEditLessonContent] = useState("");
  const [editLessonResources, setEditLessonResources] = useState<
    Array<{ name: string; type: "file" | "link"; url: string; key?: string }>
  >([]);
  const [editingLesson, setEditingLesson] = useState(false);

  // Quiz state
  const [quizTitle, setQuizTitle] = useState(quiz?.title || "");
  const [quizDescription, setQuizDescription] = useState(quiz?.description || "");
  const [quizOpenAt, setQuizOpenAt] = useState(
    quiz?.openAt ? new Date(quiz.openAt).toISOString().slice(0, 16) : ""
  );
  const [quizCloseAt, setQuizCloseAt] = useState(
    quiz?.closeAt ? new Date(quiz.closeAt).toISOString().slice(0, 16) : ""
  );
  const [quizTimeLimitMinutes, setQuizTimeLimitMinutes] = useState(
    quiz?.timeLimitMinutes || 30
  );
  const [quizGradeCategory, setQuizGradeCategory] = useState(
    quiz?.gradeCategory || "Quiz"
  );
  const [quizAttemptsAllowed, setQuizAttemptsAllowed] = useState(
    quiz?.attemptsAllowed || 1
  );
  const [quizPassMark, setQuizPassMark] = useState(quiz?.passMarkPercent || 70);
  const [quizQuestionsPerPage, setQuizQuestionsPerPage] = useState(
    quiz?.questionsPerPage || 5
  );
  const [quizReviewOptions, setQuizReviewOptions] = useState({
    showMarks: quiz?.reviewOptions?.showMarks !== false,
    showCorrectAnswers: quiz?.reviewOptions?.showCorrectAnswers === true,
    showFeedback: quiz?.reviewOptions?.showFeedback !== false,
  });
  const [questions, setQuestions] = useState<QuizQuestion[]>(
    (quiz?.questions || []).map((question) => ({
      ...question,
      type:
        question.type === "MCQ"
          ? "MULTIPLE_CHOICE"
          : question.type === "DESCRIPTIVE"
            ? "ESSAY"
            : question.type,
      marks:
        typeof question.marks === "number" && question.marks > 0
          ? question.marks
          : 1,
      options: question.options || [],
      acceptedAnswers: question.acceptedAnswers || [],
      matchingPairs: question.matchingPairs || [],
    }))
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
    let slideResource:
      | { name: string; type: "file" | "link"; url: string; key?: string }
      | undefined;

    if (newLessonSlideFile) {
      const uploaded = await uploadSlide(newLessonSlideFile);
      if (!uploaded) {
        setAddingLesson(false);
        return;
      }
      slideResource = uploaded;
    }

    const res = await fetch(
      `/api/facilitator/courses/${courseId}/modules/${selectedModule}/lessons`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newLessonTitle,
          videoUrl: newLessonVideo || undefined,
          content: newLessonContent || undefined,
          resources: slideResource ? [slideResource] : [],
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
      setNewLessonSlideFile(null);
    }
  }

  async function uploadSlide(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("context", "slides");

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) return null;
    const data = await res.json();
    return {
      name: data.name,
      type: "file" as const,
      url: data.url,
      key: data.key,
    };
  }

  function startEditLesson(lesson: Lesson) {
    setEditingLessonId(lesson._id);
    setEditLessonTitle(lesson.title);
    setEditLessonVideo(lesson.videoUrl || "");
    setEditLessonContent(lesson.content || "");
    setEditLessonResources(lesson.resources || []);
  }

  function cancelEditLesson() {
    setEditingLessonId(null);
    setEditLessonTitle("");
    setEditLessonVideo("");
    setEditLessonContent("");
    setEditLessonResources([]);
  }

  async function addSlideToEditingLesson(file: File) {
    const uploaded = await uploadSlide(file);
    if (!uploaded) return;
    setEditLessonResources((prev) => [...prev, uploaded]);
  }

  async function saveEditedLesson(moduleId: string, lessonId: string) {
    setEditingLesson(true);
    const res = await fetch(
      `/api/facilitator/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editLessonTitle,
          videoUrl: editLessonVideo || null,
          content: editLessonContent || null,
          resources: editLessonResources,
        }),
      }
    );
    setEditingLesson(false);

    if (res.ok) {
      const updated = await res.json();
      setLessons((prev) =>
        prev.map((lesson) => (lesson._id === lessonId ? updated : lesson))
      );
      cancelEditLesson();
    }
  }

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      {
        type: "MULTIPLE_CHOICE",
        name: "",
        question: "",
        marks: 1,
        options: ["", "", "", ""],
        correctIndex: 0,
        acceptedAnswers: [],
        matchingPairs: [],
      },
    ]);
  }

  function updateQuestion(
    i: number,
    field: keyof QuizQuestion,
    value: string | number | string[] | undefined
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

    const normalizedQuestions = questions.map((question) => {
      if (question.type === "ESSAY") {
        return {
          type: "ESSAY",
          name: question.name?.trim() || undefined,
          question: question.question,
          marks: question.marks || 1,
          selfMarkingGuidance: question.selfMarkingGuidance || "",
          feedback: question.feedback || "",
        };
      }

      if (question.type === "TRUE_FALSE") {
        return {
          type: "TRUE_FALSE",
          name: question.name?.trim() || undefined,
          question: question.question,
          marks: question.marks || 1,
          correctIndex: question.correctIndex === 1 ? 1 : 0,
          feedback: question.feedback || "",
        };
      }

      if (question.type === "SHORT_ANSWER") {
        return {
          type: "SHORT_ANSWER",
          name: question.name?.trim() || undefined,
          question: question.question,
          marks: question.marks || 1,
          acceptedAnswers: (question.acceptedAnswers || [])
            .map((answer) => answer.trim())
            .filter(Boolean),
          feedback: question.feedback || "",
        };
      }

      if (question.type === "MATCHING") {
        return {
          type: "MATCHING",
          name: question.name?.trim() || undefined,
          question: question.question,
          marks: question.marks || 1,
          matchingPairs: (question.matchingPairs || [])
            .map((pair) => ({
              left: pair.left.trim(),
              right: pair.right.trim(),
            }))
            .filter((pair) => pair.left && pair.right),
          feedback: question.feedback || "",
        };
      }

      return {
        type: "MULTIPLE_CHOICE",
        name: question.name?.trim() || undefined,
        question: question.question,
        marks: question.marks || 1,
        options: question.options || ["", "", "", ""],
        correctIndex: question.correctIndex ?? 0,
        feedback: question.feedback || "",
      };
    });

    const res = await fetch(
      `/api/facilitator/courses/${courseId}/quizzes`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: quizTitle,
          description: quizDescription,
          openAt: quizOpenAt || undefined,
          closeAt: quizCloseAt || undefined,
          timeLimitMinutes: quizTimeLimitMinutes,
          gradeCategory: quizGradeCategory,
          attemptsAllowed: quizAttemptsAllowed,
          questions: normalizedQuestions,
          passMarkPercent: quizPassMark,
          questionsPerPage: quizQuestionsPerPage,
          reviewOptions: quizReviewOptions,
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
                      {editingLessonId === l._id ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={editLessonTitle}
                            onChange={(e) => setEditLessonTitle(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Lesson title"
                          />
                          <input
                            type="url"
                            value={editLessonVideo}
                            onChange={(e) => setEditLessonVideo(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Video URL (optional)"
                          />
                          <textarea
                            value={editLessonContent}
                            onChange={(e) => setEditLessonContent(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            placeholder="Lesson content / notes"
                            rows={3}
                          />
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              Upload slide (PPT/PDF)
                            </label>
                            <input
                              type="file"
                              accept=".ppt,.pptx,.pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  addSlideToEditingLesson(file);
                                  e.currentTarget.value = "";
                                }
                              }}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            />
                          </div>
                          {editLessonResources.length > 0 && (
                            <div className="space-y-1">
                              {editLessonResources.map((resource, resourceIndex) => (
                                <div
                                  key={`${resource.url}-${resourceIndex}`}
                                  className="flex items-center justify-between text-xs text-gray-600"
                                >
                                  <a
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline truncate"
                                  >
                                    {resource.name}
                                  </a>
                                  <button
                                    onClick={() =>
                                      setEditLessonResources((prev) =>
                                        prev.filter((_, idx) => idx !== resourceIndex)
                                      )
                                    }
                                    className="text-red-500 hover:underline"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => saveEditedLesson(m._id, l._id)}
                              disabled={editingLesson || !editLessonTitle.trim()}
                              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
                            >
                              {editingLesson ? "Saving..." : "Save"}
                            </button>
                            <button
                              onClick={cancelEditLesson}
                              className="text-xs text-gray-500 hover:underline"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-medium">{l.title}</div>
                              {l.videoUrl && (
                                <div className="text-xs text-gray-400 mt-0.5">
                                  🎬 Video: {l.videoUrl}
                                </div>
                              )}
                              {l.content && (
                                <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                  {l.content}
                                </div>
                              )}
                              {(l.resources || []).length > 0 && (
                                <div className="text-xs text-blue-600 mt-1">
                                  📎 {(l.resources || []).length} resource(s)
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => startEditLesson(l)}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Edit
                            </button>
                          </div>
                        </>
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
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Upload slide (PPT/PDF) (optional)
                    </label>
                    <input
                      type="file"
                      accept=".ppt,.pptx,.pdf"
                      onChange={(e) => setNewLessonSlideFile(e.target.files?.[0] || null)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
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
                  value={q.name || ""}
                  onChange={(e) => updateQuestion(i, "name", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Question name"
                />
                <input
                  type="text"
                  value={q.question}
                  onChange={(e) => updateQuestion(i, "question", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Question text"
                />
                <input
                  type="number"
                  min={1}
                  value={q.marks || 1}
                  onChange={(e) => updateQuestion(i, "marks", Number(e.target.value))}
                  className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Marks"
                />
                <select
                  value={q.type}
                  onChange={(e) => {
                    const nextType = e.target.value as QuizQuestion["type"];
                    setQuestions((prev) => {
                      const updated = [...prev];
                      const baseQuestion = {
                        ...updated[i],
                        type: nextType,
                        marks: updated[i].marks || 1,
                      };

                      if (nextType === "MULTIPLE_CHOICE") {
                        updated[i] = {
                          ...baseQuestion,
                          options: ["", "", "", ""],
                          correctIndex: 0,
                          acceptedAnswers: [],
                          matchingPairs: [],
                          selfMarkingGuidance: "",
                        };
                        return updated;
                      }

                      if (nextType === "TRUE_FALSE") {
                        updated[i] = {
                          ...baseQuestion,
                          options: ["True", "False"],
                          correctIndex: 0,
                          acceptedAnswers: [],
                          matchingPairs: [],
                          selfMarkingGuidance: "",
                        };
                        return updated;
                      }

                      if (nextType === "SHORT_ANSWER") {
                        updated[i] = {
                          ...baseQuestion,
                          options: [],
                          correctIndex: undefined,
                          acceptedAnswers: [""],
                          matchingPairs: [],
                          selfMarkingGuidance: "",
                        };
                        return updated;
                      }

                      if (nextType === "MATCHING") {
                        updated[i] = {
                          ...baseQuestion,
                          options: [],
                          correctIndex: undefined,
                          acceptedAnswers: [],
                          matchingPairs: [
                            { left: "", right: "" },
                            { left: "", right: "" },
                          ],
                          selfMarkingGuidance: "",
                        };
                        return updated;
                      }

                      updated[i] = {
                        ...baseQuestion,
                        options: [],
                        correctIndex: undefined,
                        acceptedAnswers: [],
                        matchingPairs: [],
                      };
                      return updated;
                    });
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                  <option value="TRUE_FALSE">True / False</option>
                  <option value="SHORT_ANSWER">Short Answer</option>
                  <option value="MATCHING">Matching</option>
                  <option value="ESSAY">Essay</option>
                </select>

                {q.type === "MULTIPLE_CHOICE" ? (
                  <div className="space-y-2">
                    {(q.options || ["", "", "", ""]).map((opt, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${i}`}
                          checked={(q.correctIndex ?? 0) === j}
                          onChange={() => updateQuestion(i, "correctIndex", j)}
                          className="text-blue-600"
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOptions = [...(q.options || ["", "", "", ""])];
                            newOptions[j] = e.target.value;
                            updateQuestion(i, "options", newOptions);
                          }}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={`Option ${j + 1}${(q.correctIndex ?? 0) === j ? " (correct)" : ""}`}
                        />
                      </div>
                    ))}
                  </div>
                ) : q.type === "TRUE_FALSE" ? (
                  <div className="space-y-2">
                    {["True", "False"].map((opt, j) => (
                      <label key={opt} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="radio"
                          name={`tf-${i}`}
                          checked={(q.correctIndex ?? 0) === j}
                          onChange={() => updateQuestion(i, "correctIndex", j)}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                ) : q.type === "SHORT_ANSWER" ? (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">Accepted answers</p>
                    {(q.acceptedAnswers || [""]).map((answer, answerIndex) => (
                      <input
                        key={answerIndex}
                        type="text"
                        value={answer}
                        onChange={(e) => {
                          const next = [...(q.acceptedAnswers || [""])];
                          next[answerIndex] = e.target.value;
                          updateQuestion(i, "acceptedAnswers", next);
                        }}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        placeholder={`Accepted answer ${answerIndex + 1}`}
                      />
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        updateQuestion(i, "acceptedAnswers", [
                          ...(q.acceptedAnswers || []),
                          "",
                        ])
                      }
                      className="text-xs text-blue-600 hover:underline"
                    >
                      + Add accepted answer
                    </button>
                  </div>
                ) : q.type === "MATCHING" ? (
                  <div className="space-y-2">
                    {(q.matchingPairs || []).map((pair, pairIndex) => (
                      <div key={pairIndex} className="grid gap-2 sm:grid-cols-2">
                        <input
                          type="text"
                          value={pair.left}
                          onChange={(e) => {
                            const nextPairs = [...(q.matchingPairs || [])];
                            nextPairs[pairIndex] = {
                              ...nextPairs[pairIndex],
                              left: e.target.value,
                            };
                            updateQuestion(i, "matchingPairs", nextPairs);
                          }}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          placeholder="Left item"
                        />
                        <input
                          type="text"
                          value={pair.right}
                          onChange={(e) => {
                            const nextPairs = [...(q.matchingPairs || [])];
                            nextPairs[pairIndex] = {
                              ...nextPairs[pairIndex],
                              right: e.target.value,
                            };
                            updateQuestion(i, "matchingPairs", nextPairs);
                          }}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          placeholder="Matching value"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        updateQuestion(i, "matchingPairs", [
                          ...(q.matchingPairs || []),
                          { left: "", right: "" },
                        ])
                      }
                      className="text-xs text-blue-600 hover:underline"
                    >
                      + Add pair
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      value={q.selfMarkingGuidance || ""}
                      onChange={(e) =>
                        updateQuestion(i, "selfMarkingGuidance", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={3}
                      placeholder="Essay guidance / rubric"
                    />
                  </div>
                )}

                <textarea
                  value={q.feedback || ""}
                  onChange={(e) => updateQuestion(i, "feedback", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                  rows={2}
                  placeholder="Feedback to show after submission (optional)"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={saveQuiz}
              disabled={savingQuiz || !quizTitle || questions.length === 0}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {savingQuiz ? "Saving..." : "Save and display"}
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
