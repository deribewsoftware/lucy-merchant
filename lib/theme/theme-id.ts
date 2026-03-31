export const THEME_IDS = ["business", "corporate", "light", "night"] as const;
export type ThemeId = (typeof THEME_IDS)[number];

const ALLOWED = new Set<string>(THEME_IDS);

export function normalizeThemeId(raw: string | null | undefined): ThemeId {
  return raw && ALLOWED.has(raw) ? (raw as ThemeId) : "business";
}
