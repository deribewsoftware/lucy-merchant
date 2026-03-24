"use client";

import { useEffect, useState } from "react";
import { HiOutlineSparkles } from "react-icons/hi2";
import { MdDarkMode, MdLightMode } from "react-icons/md";

const STORAGE_KEY = "lm-theme";

const OPTIONS = [
  { value: "business", label: "Business" },
  { value: "corporate", label: "Corporate" },
  { value: "light", label: "Light" },
  { value: "night", label: "Midnight" },
] as const;

export function ThemeToggle() {
  const [current, setCurrent] = useState<string>("business");

  useEffect(() => {
    const t =
      localStorage.getItem(STORAGE_KEY) ??
      document.documentElement.getAttribute("data-theme") ??
      "business";
    setCurrent(t);
  }, []);

  function apply(theme: string) {
    setCurrent(theme);
    localStorage.setItem(STORAGE_KEY, theme);
    document.documentElement.setAttribute("data-theme", theme);
  }

  const isDarkish = current === "night";

  return (
    <div className="dropdown dropdown-end">
      <div
        tabIndex={0}
        role="button"
        className="btn btn-ghost btn-circle btn-sm"
        aria-label="Choose color theme"
      >
        {current === "light" ? (
          <MdLightMode className="h-5 w-5" />
        ) : isDarkish ? (
          <MdDarkMode className="h-5 w-5" />
        ) : (
          <HiOutlineSparkles className="h-5 w-5" />
        )}
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content menu z-[100] w-48 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg"
      >
        {OPTIONS.map((o) => (
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
