/** Total pages for a given item count and page size (at least 1 when total > 0). */
export function totalPagesFor(total: number, pageSize: number): number {
  if (total <= 0) return 1;
  return Math.max(1, Math.ceil(total / pageSize));
}

/** Clamp requested page into [1, totalPages]. */
export function clampPage(page: number, total: number, pageSize: number): number {
  const tp = totalPagesFor(total, pageSize);
  return Math.min(Math.max(1, Math.floor(page)), tp);
}

/** Inclusive start index for slice (0-based). */
export function pageStartIndex(page: number, total: number, pageSize: number): number {
  const safe = clampPage(page, total, pageSize);
  return (safe - 1) * pageSize;
}

export type PaginationItem = number | "ellipsis";

/**
 * Page numbers to show with ellipsis (e.g. 1 … 4 5 6 … 20).
 */
export function visiblePaginationItems(
  currentPage: number,
  totalPages: number,
): PaginationItem[] {
  if (totalPages <= 1) return [1];
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const p = Math.min(Math.max(1, currentPage), totalPages);
  const set = new Set<number>();
  set.add(1);
  set.add(totalPages);
  for (let i = p - 1; i <= p + 1; i++) {
    if (i >= 1 && i <= totalPages) set.add(i);
  }
  const sorted = [...set].sort((a, b) => a - b);
  const out: PaginationItem[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      out.push("ellipsis");
    }
    out.push(sorted[i]);
  }
  return out;
}

/** Human-readable "Showing a–b of n" (1-based). */
export function formatPaginationRange(
  page: number,
  pageSize: number,
  total: number,
): string {
  if (total <= 0) return "0 results";
  const safe = clampPage(page, total, pageSize);
  const start = (safe - 1) * pageSize + 1;
  const end = Math.min(safe * pageSize, total);
  return `Showing ${start}–${end} of ${total}`;
}
