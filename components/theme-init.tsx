"use client";

import { useLayoutEffect } from "react";
import {
  hasThemeCookieClient,
  setThemeCookieClient,
} from "@/lib/theme/theme-cookie";
import { normalizeThemeId } from "@/lib/theme/theme-id";

const STORAGE_KEY = "lm-theme";

/**
 * After hydration: prefer localStorage (legacy), else keep SSR `data-theme` from cookie,
 * else map default business to prefers-color-scheme when no theme cookie exists yet.
 */
export function ThemeInit() {
  useLayoutEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      const t = normalizeThemeId(saved);
      document.documentElement.setAttribute("data-theme", t);
      setThemeCookieClient(t);
      return;
    }
    const attr = document.documentElement.getAttribute("data-theme") ?? "business";
    let t = normalizeThemeId(attr);
    if (t === "business" && !hasThemeCookieClient()) {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) t = "night";
    }
    document.documentElement.setAttribute("data-theme", t);
    setThemeCookieClient(t);
    localStorage.setItem(STORAGE_KEY, t);
  }, []);
  return null;
}
