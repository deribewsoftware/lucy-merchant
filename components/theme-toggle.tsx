"use client";

import { useEffect, useState } from "react";
import { MdDarkMode, MdLightMode } from "react-icons/md";
import { setThemeCookieClient } from "@/lib/theme/theme-cookie";
import { normalizeThemeId, type ThemeId } from "@/lib/theme/theme-id";

const STORAGE_KEY = "lm-theme";

export const THEME_OPTIONS = [
  { value: "business", label: "Business (dark)" },
  { value: "corporate", label: "Corporate (light)" },
  { value: "light", label: "Light" },
  { value: "night", label: "Midnight" },
] as const satisfies ReadonlyArray<{ value: ThemeId; label: string }>;

export function ThemeToggle() {
  const [current, setCurrent] = useState<ThemeId>("business");

  useEffect(() => {
    const raw =
      localStorage.getItem(STORAGE_KEY) ??
      document.documentElement.getAttribute("data-theme") ??
      "business";
    const t = normalizeThemeId(raw);
    setCurrent(t);
    document.documentElement.setAttribute("data-theme", t);
    setThemeCookieClient(t);
    if (raw !== t) {
      localStorage.setItem(STORAGE_KEY, t);
    }
  }, []);

  function apply(theme: ThemeId) {
    const t = normalizeThemeId(theme);
    setCurrent(t);
    localStorage.setItem(STORAGE_KEY, t);
    setThemeCookieClient(t);
    document.documentElement.setAttribute("data-theme", t);
  }

  const lightish = current === "light" || current === "corporate";

  return (
    <div className="dropdown dropdown-end">
      <div
        tabIndex={0}
        role="button"
        className="btn btn-ghost btn-circle btn-sm"
        aria-label="Choose color theme"
      >
        {lightish ? (
          <MdLightMode className="h-5 w-5" />
        ) : (
          <MdDarkMode className="h-5 w-5" />
        )}
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content menu z-[100] w-52 rounded-box border border-base-300/45 bg-base-100 p-2 shadow-lg"
      >
        {THEME_OPTIONS.map((o) => (
          <li key={o.value}>
            <button
              type="button"
              className={current === o.value ? "active font-semibold" : ""}
              onClick={() => apply(o.value)}
            >
              {o.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
