"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { usePresenceSelf } from "@/components/presence-provider";
import { LM_THEME_STORAGE_KEY, THEME_OPTIONS } from "@/components/theme-toggle";
import { setThemeCookieClient } from "@/lib/theme/theme-cookie";
import { normalizeThemeId, type ThemeId } from "@/lib/theme/theme-id";

/**
 * Same behavior as the header theme menu — stored in localStorage + cookie for SSR.
 */
export function ThemeAppearanceSection() {
  const [current, setCurrent] = useState<ThemeId>("business");
  const { selfIsOnline } = usePresenceSelf();

  useEffect(() => {
    const raw =
      localStorage.getItem(LM_THEME_STORAGE_KEY) ??
      document.documentElement.getAttribute("data-theme") ??
      "business";
    const t = normalizeThemeId(raw);
    setCurrent(t);
    document.documentElement.setAttribute("data-theme", t);
    setThemeCookieClient(t);
    if (raw !== t) {
      localStorage.setItem(LM_THEME_STORAGE_KEY, t);
    }
  }, []);

  function apply(theme: ThemeId) {
    const t = normalizeThemeId(theme);
    setCurrent(t);
    localStorage.setItem(LM_THEME_STORAGE_KEY, t);
    setThemeCookieClient(t);
    document.documentElement.setAttribute("data-theme", t);
  }

  return (
    <div className="lm-card border border-border/50 p-6 sm:p-8">
      <h2 className="font-display text-lg font-semibold text-foreground">Appearance</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Color theme is saved in this browser (same as the control in the site header). It is not
        synced to your server profile.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {THEME_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            className={clsx(
              "rounded-xl border px-3 py-2.5 text-left text-sm transition",
              current === o.value
                ? "border-primary bg-primary/10 font-medium text-foreground"
                : "border-border/50 bg-background hover:border-border hover:bg-muted/30",
            )}
            onClick={() => apply(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div className="mt-6 border-t border-border/40 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Presence
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {selfIsOnline
            ? "You currently show as online to others when they view order chats or shared views (this tab is active and your session is recent)."
            : "You show as away or offline when this tab is in the background, hidden, or after a short idle period. Open the site in a visible tab to send heartbeats."}
        </p>
      </div>
    </div>
  );
}
