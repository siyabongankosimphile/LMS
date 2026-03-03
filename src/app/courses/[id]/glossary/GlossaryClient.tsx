"use client";

import { useMemo, useState } from "react";

type Entry = {
  _id: string;
  term: string;
  definition: string;
  category?: string;
  createdAt: string;
  createdBy?: { name?: string; surname?: string };
};

type Props = {
  courseId: string;
  initialEntries: Entry[];
};

export default function GlossaryClient({ courseId, initialEntries }: Props) {
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [term, setTerm] = useState("");
  const [definition, setDefinition] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [saving, setSaving] = useState(false);

  const categories = useMemo(() => {
    const unique = new Set(entries.map((entry) => entry.category).filter(Boolean));
    return Array.from(unique) as string[];
  }, [entries]);

  const filtered = useMemo(() => {
    return entries.filter((entry) => {
      const q = query.trim().toLowerCase();
      const passQuery =
        !q ||
        entry.term.toLowerCase().includes(q) ||
        entry.definition.toLowerCase().includes(q);
      const passCategory = !category || String(entry.category || "") === category;
      return passQuery && passCategory;
    });
  }, [entries, query, category]);

  async function addEntry() {
    if (!term.trim() || !definition.trim()) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/glossary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          term: term.trim(),
          definition: definition.trim(),
          category: newCategory.trim() || undefined,
        }),
      });

      if (!res.ok) return;
      const data = await res.json();
      if (data.entry) {
        setEntries((prev) => [
          {
            _id: String(data.entry._id),
            term: data.entry.term,
            definition: data.entry.definition,
            category: data.entry.category,
            createdAt: new Date(data.entry.createdAt).toISOString(),
            createdBy: data.entry.createdBy,
          },
          ...prev,
        ]);
      }

      setTerm("");
      setDefinition("");
      setNewCategory("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search glossary"
            className="rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm"
          />
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm"
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("");
            }}
            className="rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm"
          >
            Clear filters
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Add entry</h2>
        <div className="space-y-2">
          <input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Term"
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm"
          />
          <input
            value={newCategory}
            onChange={(event) => setNewCategory(event.target.value)}
            placeholder="Category (optional)"
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm"
          />
          <textarea
            rows={4}
            value={definition}
            onChange={(event) => setDefinition(event.target.value)}
            placeholder="Definition"
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={addEntry}
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save entry"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-sm text-gray-500 dark:text-gray-300">
            No glossary entries found.
          </div>
        ) : (
          filtered.map((entry) => (
            <div key={entry._id} className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">{entry.term}</h3>
                {entry.category && (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                    {entry.category}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{entry.definition}</p>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-300">
                {(entry.createdBy?.name || "User") + " " + (entry.createdBy?.surname || "")} • {new Date(entry.createdAt).toLocaleDateString("en-ZA")}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
