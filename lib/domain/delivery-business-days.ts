/**
 * Parse the upper bound of business days from free-text product lead times
 * (e.g. "3–5 business days", "3-5 business days"). Defaults when nothing matches.
 */
export function parseBusinessDaysUpperBoundFromLabel(raw: string | undefined): number {
  const s = String(raw ?? "").replace(/\u2013/g, "-").replace(/\u2014/g, "-");
  const nums = s.match(/\d+/g);
  if (!nums || nums.length === 0) return 7;
  const parsed = nums.map((x) => parseInt(x, 10)).filter((n) => n > 0 && n < 365);
  if (parsed.length === 0) return 7;
  return Math.max(...parsed);
}

const MS_DAY = 86400000;

/** Monday–Friday business days (Ethiopia / common B2B). */
export function addBusinessDays(start: Date, businessDays: number): Date {
  if (businessDays <= 0) return new Date(start);
  let d = new Date(start.getTime());
  let left = Math.ceil(businessDays);
  while (left > 0) {
    d = new Date(d.getTime() + MS_DAY);
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) left -= 1;
  }
  return d;
}

/** Start of SLA in UTC for comparisons (order timestamps are ISO strings). */
export function parseOrderDate(iso: string | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}
