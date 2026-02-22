"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CourseActions({
  courseId,
  courseTitle,
}: {
  courseId: string;
  courseTitle: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const typedName = window.prompt(
      `Type the course title to confirm deletion:\n\n${courseTitle}`
    );

    if (!typedName) return;
    if (typedName.trim() !== courseTitle) {
      window.alert("Course title does not match. Deletion cancelled.");
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/facilitator/courses/${courseId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to delete course");
        return;
      }

      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href={`/facilitator/courses/${courseId}`}
        className="text-blue-600 font-medium hover:underline text-xs"
      >
        Manage →
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
      >
        {deleting ? "Deleting..." : "Delete"}
      </button>
    </div>
  );
}
