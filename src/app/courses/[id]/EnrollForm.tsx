"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EnrollForm({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleEnroll(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/courses/${courseId}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentKey: key }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Enrollment failed");
        return;
      }

      router.refresh();
      router.push(`/courses/${courseId}/learn`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleEnroll}>
      <h3 className="font-semibold text-gray-900 mb-3">Enroll in this course</h3>
      <p className="text-sm text-gray-500 mb-4">
        Enter the enrollment key provided by your facilitator.
      </p>
      {error && (
        <div className="text-red-600 text-sm mb-3 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
      <input
        type="text"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        required
        placeholder="Enter enrollment key"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Enrolling..." : "Enroll Now"}
      </button>
    </form>
  );
}
