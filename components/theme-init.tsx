"use client";

import { useEffect } from "react";

const STORAGE_KEY = "lm-theme";

/** Defaults match Daisy themes in globals.css */
export function ThemeInit() {
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const theme = saved ?? (prefersDark ? "night" : "business");
    document.documentElement.setAttribute("data-theme", theme);
  }, []);
  return null;
}
