import type { ThemeId } from "./theme-id";

/** Same key as localStorage — server reads this so `<html data-theme>` matches without inline scripts. */
export const THEME_COOKIE_NAME = "lm-theme";

export function decodeThemeCookieValue(raw: string | undefined | null): string | undefined {
  if (raw == null || raw === "") return undefined;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/** True if a non-HttpOnly `lm-theme` cookie is visible to JS (client-only). */
export function hasThemeCookieClient(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((c) => c.trim().startsWith(`${THEME_COOKIE_NAME}=`));
}

/** Client-only: persist theme for the next full request (SSR + no flash). */
export function setThemeCookieClient(theme: ThemeId): void {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 365;
  const secure = typeof location !== "undefined" && location.protocol === "https:";
  document.cookie = [
    `${THEME_COOKIE_NAME}=${encodeURIComponent(theme)}`,
    "path=/",
    `max-age=${maxAge}`,
    "SameSite=Lax",
    ...(secure ? ["Secure"] : []),
  ].join("; ");
}
