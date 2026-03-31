"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { PaginationBar, PaginationSummary } from "@/components/ui/pagination-bar";
import { clampPage, pageStartIndex } from "@/lib/utils/pagination";

/**
 * Client-side slice + shared pagination controls for static lists passed from the server.
 */
export function PaginatedClientList<T>({
  items,
  pageSize = 12,
  resetKey,
  children,
  barClassName,
  summaryClassName,
  summarySuffix,
  /** Called when `resetKey` or item count changes (list reset to page 1). */
  onReset,
  /** Called when the user picks a page (not when resetting to page 1 automatically). */
  onPageSelect,
}: {
  items: readonly T[];
  pageSize?: number;
  /** When this changes (e.g. order id), reset to page 1 */
  resetKey?: string;
  children: (pageItems: T[]) => ReactNode;
  barClassName?: string;
  summaryClassName?: string;
  summarySuffix?: ReactNode;
  onReset?: () => void;
  onPageSelect?: (page: number) => void;
}) {
  const [page, setPage] = useState(1);
  const total = items.length;
  const onResetRef = useRef(onReset);

  useEffect(() => {
    onResetRef.current = onReset;
  }, [onReset]);

  useEffect(() => {
    setPage(1);
    onResetRef.current?.();
  }, [resetKey, total]);

  const safe = clampPage(page, total, pageSize);
  const start = pageStartIndex(safe, total, pageSize);
  const pageItems = items.slice(start, start + pageSize);

  function handlePageChange(next: number) {
    setPage(next);
    onPageSelect?.(next);
  }

  return (
    <>
      {total > 0 && (
        <PaginationSummary
          page={safe}
          pageSize={pageSize}
          total={total}
          className={summaryClassName}
          suffix={summarySuffix}
        />
      )}
      {children(pageItems)}
      <PaginationBar
        page={safe}
        pageSize={pageSize}
        total={total}
        onPageChange={handlePageChange}
        className={barClassName ?? "mt-4"}
      />
    </>
  );
}
