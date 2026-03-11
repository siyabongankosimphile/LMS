"use client";

import { useCallback, useEffect, useState } from "react";

type Participant = {
  _id: string;
  student: {
    _id: string;
    name?: string;
    surname?: string;
    email?: string;
    status?: string;
  };
  enrolledAt: string;
};

type Candidate = {
  _id: string;
  name?: string;
  surname?: string;
  email?: string;
};

export default function ParticipantsManager({ courseId }: { courseId: string }) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEnrollForm, setShowEnrollForm] = useState(true);
  const [actionMsg, setActionMsg] = useState("");
  const [actionError, setActionError] = useState("");
  const [highlightedStudentId, setHighlightedStudentId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/facilitator/courses/${courseId}/participants`);
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const data = await res.json();
    setParticipants(data.participants || []);
    setCandidates(data.candidates || []);
    setLoading(false);
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  async function enrollStudent() {
    if (!selectedStudentId) return;
    setActionMsg("");
    setActionError("");
    setSaving(true);

    try {
      const enrolledStudentId = selectedStudentId;
      const res = await fetch(`/api/facilitator/courses/${courseId}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: selectedStudentId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionError(data.error || "Failed to enroll student.");
        return;
      }

      setSelectedStudentId("");
      setShowEnrollForm(false);
      setActionMsg("Student enrolled successfully.");
      setHighlightedStudentId(enrolledStudentId);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function unenrollStudent(studentId: string) {
    setActionMsg("");
    setActionError("");
    const res = await fetch(
      `/api/facilitator/courses/${courseId}/participants?studentId=${studentId}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setActionError(data.error || "Failed to unenroll student.");
      return;
    }
    setActionMsg("Participant removed.");
    if (highlightedStudentId === studentId) {
      setHighlightedStudentId("");
    }
    await load();
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Loading participants...</p>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-800">Manual enrolment</h2>
          <button
            type="button"
            onClick={() => setShowEnrollForm((prev) => !prev)}
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            {showEnrollForm ? "Close form" : "Enrol participant"}
          </button>
        </div>
        {actionError && (
          <p className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {actionError}
          </p>
        )}
        {actionMsg && (
          <p className="mb-3 rounded border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
            {actionMsg}
          </p>
        )}
        {showEnrollForm ? (
          <div className="flex gap-2">
            <select
              value={selectedStudentId}
              onChange={(event) => setSelectedStudentId(event.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Select student...</option>
              {candidates.map((student) => (
                <option key={student._id} value={student._id}>
                  {(student.name || "Student") + " " + (student.surname || "")} • {student.email || ""}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={enrollStudent}
              disabled={!selectedStudentId || saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Enrolling..." : "Enrol user"}
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Form closed. Use &quot;Enrol participant&quot; to add another student.</p>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-2">Participants ({participants.length})</h2>
        <div className="space-y-2">
          {participants.map((participant) => (
            <div
              key={participant._id}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                highlightedStudentId && highlightedStudentId === String(participant.student?._id)
                  ? "border-green-300 bg-green-50"
                  : "border-gray-100"
              }`}
            >
              <div>
                <p className="text-sm text-gray-800">
                  {(participant.student?.name || "Student") + " " + (participant.student?.surname || "")}
                </p>
                <p className="text-xs text-gray-500">{participant.student?.email || ""}</p>
              </div>
              <div className="flex items-center gap-3">
                {participant.student?.email && (
                  <a href={`mailto:${participant.student.email}`} className="text-xs text-blue-600 hover:underline">
                    Message
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => unenrollStudent(String(participant.student._id))}
                  className="text-xs text-red-600 hover:underline"
                >
                  Unenrol
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
