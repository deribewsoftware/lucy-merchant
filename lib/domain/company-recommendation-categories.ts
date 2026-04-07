/** Max catalog categories a supplier may tag for discovery & home recommendations. */
export const MAX_COMPANY_RECOMMENDATION_CATEGORIES = 5;

/**
 * Dedupe, validate against catalog ids, preserve order, cap length.
 */
export function normalizeRecommendationCategoryIds(
  raw: unknown,
  validIds: Set<string>,
): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const x of raw) {
    const id = typeof x === "string" ? x.trim() : "";
    if (!id || !validIds.has(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= MAX_COMPANY_RECOMMENDATION_CATEGORIES) break;
  }
  return out;
}
