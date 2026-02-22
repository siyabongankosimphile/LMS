"use client";

import { useState } from "react";

interface Facilitator {
  _id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
}

export default function FacilitatorApprovals({
  facilitators: initial,
}: {
  facilitators: Facilitator[];
}) {
  const [facilitators, setFacilitators] = useState(initial);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleAction(id: string, action: "approve" | "reject") {
    setLoading(`${id}-${action}`);
    try {
      const res = await fetch(`/api/admin/facilitators/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const updated = await res.json();
        setFacilitators((prev) =>
          prev.map((f) => (f._id === id ? { ...f, status: updated.status } : f))
        );
      }
    } finally {
      setLoading(null);
    }
  }

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    PENDING_APPROVAL: "bg-amber-100 text-amber-700",
    REJECTED: "bg-red-100 text-red-700",
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
      {facilitators.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-300">
          No facilitators registered yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Name</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Email</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Applied</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
              {facilitators.map((f) => (
                <tr key={f._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/40">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{f.name}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{f.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        statusColors[f.status] || ""
                      }`}
                    >
                      {f.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-300">
                    {new Date(f.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {f.status !== "ACTIVE" && (
                        <button
                          onClick={() => handleAction(f._id, "approve")}
                          disabled={loading === `${f._id}-approve`}
                          className="bg-green-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {loading === `${f._id}-approve`
                            ? "..."
                            : "Approve"}
                        </button>
                      )}
                      {f.status !== "REJECTED" && (
                        <button
                          onClick={() => handleAction(f._id, "reject")}
                          disabled={loading === `${f._id}-reject`}
                          className="bg-red-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          {loading === `${f._id}-reject`
                            ? "..."
                            : "Reject"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
