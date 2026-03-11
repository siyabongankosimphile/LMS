"use client";

import { useEffect, useState } from "react";
import { FaMoon, FaSun } from "react-icons/fa";
import { useSession } from "next-auth/react";

export default function DarkModeToggle() {
  const { data: session, status } = useSession();
  const [isDark, setIsDark] = useState(false);

  function applyTheme(nextDark: boolean) {
    const root = document.documentElement;
    const body = document.body;
    root.classList.toggle("dark", nextDark);
    body.classList.toggle("dark", nextDark);
    setIsDark(nextDark);
  }

  useEffect(() => {
    if (status === "loading") return;

    const userId = session?.user?.id;
    if (!userId) {
      // Unauthenticated/default state should always be light.
      applyTheme(false);
      return;
    }

    const savedTheme = localStorage.getItem(`theme:${userId}`);
    const shouldUseDark = savedTheme === "dark";
    applyTheme(shouldUseDark);
  }, [session?.user?.id, status]);

  const toggleTheme = () => {
    const userId = session?.user?.id;
    if (!userId) return;

    const nextDark = !isDark;
    applyTheme(nextDark);
    localStorage.setItem(`theme:${userId}`, nextDark ? "dark" : "light");
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
      aria-label="Toggle dark mode"
    >
      {isDark ? <FaSun className="text-amber-400" /> : <FaMoon className="text-slate-600" />}
      {isDark ? "Light mode" : "Dark mode"}
    </button>
  );
}
