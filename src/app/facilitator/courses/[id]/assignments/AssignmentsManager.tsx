"use client";

import { useCallback, useEffect, useState } from "react";

type Assignment = {
  _id: string;
  title: string;
  description?: string;
  dueAt?: string;
  attachment?: {
    url: string;
    name: string;
  };
};

type Submission = {
  _id: string;
  content?: string;
  attachment?: {
    url: string;
    name: string;
  };
  status: "SUBMITTED" | "GRADED";
  score?: number;
  feedback?: string;
  student?: { name?: string; surname?: string; email?: string };
};

export default function AssignmentsManager({ courseId }: { courseId: string }) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);
  const [assignmentUploadName, setAssignmentUploadName] = useState("");
  const [uploadingAssignmentFile, setUploadingAssignmentFile] = useState(false);
  const [savingAssignment, setSavingAssignment] = useState(false);

  const [gradingState, setGradingState] = useState<
    Record<string, { score: string; feedback: string; saving: boolean }>
  >({});

  const loadAssignments = useCallback(async () => {
    const res = await fetch(`/api/facilitator/courses/${courseId}/assignments`);
    if (!res.ok) return;
    const data = await res.json();
    setAssignments(data.assignments || []);
  }, [courseId]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  async function createAssignment(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSavingAssignment(true);
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

      if (assignmentFile) {
        setUploadingAssignmentFile(true);
        const formData = new FormData();
        formData.append("file", assignmentFile);
        formData.append("context", `assignment-resources/${courseId}`);

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
          contentType: assignmentFile.type,
          size: assignmentFile.size,
        };
      }

      const res = await fetch(`/api/facilitator/courses/${courseId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          dueAt: dueAt || undefined,
          attachment,
        }),
      });
      if (!res.ok) return;
      setTitle("");
      setDescription("");
      setDueAt("");
      setAssignmentFile(null);
      setAssignmentUploadName("");
      await loadAssignments();
    } finally {
      setUploadingAssignmentFile(false);
      setSavingAssignment(false);
    }
  }

  async function loadSubmissions(assignmentId: string) {
    setSelectedAssignmentId(assignmentId);
    const res = await fetch(`/api/assignments/${assignmentId}/submissions`);
    if (!res.ok) return;
    const data = await res.json();
    const fetched = (data.submissions || []) as Submission[];
    setSubmissions(fetched);

    const initialState: Record<string, { score: string; feedback: string; saving: boolean }> = {};
    fetched.forEach((item) => {
      initialState[item._id] = {
        score: typeof item.score === "number" ? String(item.score) : "",
        feedback: item.feedback || "",
        saving: false,
      };
    });
    setGradingState(initialState);
  }

  async function saveGrade(submissionId: string) {
    const state = gradingState[submissionId];
    if (!state) return;

    const scoreNumber = Number(state.score);
    if (!Number.isFinite(scoreNumber) || scoreNumber < 0 || scoreNumber > 100) {
      return;
    }

    setGradingState((prev) => ({
      ...prev,
      [submissionId]: { ...prev[submissionId], saving: true },
    }));

    try {
      const res = await fetch(
        `/api/assignments/${selectedAssignmentId}/submissions/${submissionId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            score: scoreNumber,
            feedback: state.feedback,
          }),
        }
      );

      if (!res.ok) return;
      await loadSubmissions(selectedAssignmentId);
    } finally {
      setGradingState((prev) => ({
        ...prev,
        [submissionId]: { ...prev[submissionId], saving: false },
      }));
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={createAssignment}
        className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800"
      >
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
          New Assignment
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Assignment title"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />
          <input
            type="date"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Description"
          className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
        />
        <div className="mt-3">
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp,.zip"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setAssignmentFile(file);
              setAssignmentUploadName(file?.name || "");
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-300">
            Optional. Allowed: PDF, DOC, DOCX, TXT, PNG, JPG, WEBP, ZIP. Max 50MB.
          </p>
          {assignmentUploadName && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-300">
              Selected file: {assignmentUploadName}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={savingAssignment || uploadingAssignmentFile}
          className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {savingAssignment || uploadingAssignmentFile
            ? "Saving..."
            : "Create Assignment"}
        </button>
      </form>

      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
          Assignments
        </h2>
        {assignments.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-300">No assignments yet.</p>
        ) : (
          <div className="space-y-2">
            {assignments.map((assignment) => (
              <button
                key={assignment._id}
                onClick={() => loadSubmissions(assignment._id)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  selectedAssignmentId === assignment._id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-700/40"
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-white">{assignment.title}</div>
                {assignment.dueAt && (
                  <div className="text-xs text-gray-500 dark:text-gray-300">
                    Due: {new Date(assignment.dueAt).toLocaleDateString()}
                  </div>
                )}
                {assignment.attachment?.url && (
                  <a
                    href={assignment.attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-xs text-blue-600 hover:underline"
                  >
                    Attachment: {assignment.attachment.name}
                  </a>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedAssignmentId && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
            Submissions
          </h2>
          {submissions.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-300">No submissions yet.</p>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => {
                const state = gradingState[submission._id] || {
                  score: "",
                  feedback: "",
                  saving: false,
                };

                return (
                  <div
                    key={submission._id}
                    className="rounded-lg border border-gray-200 p-4 dark:border-slate-700"
                  >
                    <p className="font-medium text-gray-900 dark:text-white">
                      {(submission.student?.name || "Student") + " " + (submission.student?.surname || "")}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-300">
                      {submission.student?.email || ""}
                    </p>
                    {submission.content && (
                      <p className="mt-2 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                        {submission.content}
                      </p>
                    )}
                    {submission.attachment?.url && (
                      <a
                        href={submission.attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-xs text-blue-600 hover:underline"
                      >
                        Submission file: {submission.attachment.name}
                      </a>
                    )}

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="Score (0-100)"
                        value={state.score}
                        onChange={(e) =>
                          setGradingState((prev) => ({
                            ...prev,
                            [submission._id]: {
                              ...prev[submission._id],
                              score: e.target.value,
                            },
                          }))
                        }
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                      />
                      <input
                        placeholder="Feedback"
                        value={state.feedback}
                        onChange={(e) =>
                          setGradingState((prev) => ({
                            ...prev,
                            [submission._id]: {
                              ...prev[submission._id],
                              feedback: e.target.value,
                            },
                          }))
                        }
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => saveGrade(submission._id)}
                      disabled={state.saving}
                      className="mt-3 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {state.saving ? "Saving..." : "Save Grade + Feedback"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
