"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Category } from "@/lib/domain/types";
import { buildBrowseHref, type BrowseFilterState } from "@/lib/browse/browse-href";
import { PaginationBar, PaginationSummary } from "@/components/ui/pagination-bar";
import { FilterDropdown } from "@/components/browse/filter-dropdown";

const PAGE_SIZE = 14;

type Props = {
  sort: string;
  categoryId: string;
  categories: Category[];
  activeCategory: Category | undefined;
  filters: BrowseFilterState;
};

export function BrowseCategoryDropdown({
  sort,
  categoryId,
  categories,
  activeCategory,
  filters,
}: Props) {
  const categoryLabel = activeCategory?.name ?? "All categories";
  const [page, setPage] = useState(1);

  const resetKey = useMemo(
    () => categories.map((c) => c.id).join(","),
    [categories],
  );

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  const total = categories.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageItems = categories.slice(start, start + PAGE_SIZE);

  if (categories.length === 0) return null;

  return (
    <FilterDropdown label="Category" value={categoryLabel}>
      <Link
        href={buildBrowseHref(sort, "", filters)}
        className={`block rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted ${
          !activeCategory ? "bg-primary/10 text-primary" : "text-foreground"
        }`}
      >
        All categories
      </Link>
      {total > PAGE_SIZE && (
        <div className="border-b border-border/40 px-2 py-2">
          <PaginationSummary
            page={safePage}
            pageSize={PAGE_SIZE}
            total={total}
            className="text-xs text-muted-foreground"
            suffix="categories"
          />
        </div>
      )}
      <div className="max-h-[min(50vh,16rem)] overflow-y-auto overscroll-contain">
        {pageItems.map((c) => (
          <Link
            key={c.id}
            href={buildBrowseHref(sort, c.id, filters)}
            className={`block rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted ${
              categoryId === c.id ? "bg-primary/10 text-primary" : "text-foreground"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>
      {total > PAGE_SIZE && (
        <div className="border-t border-border/40 p-2">
          <PaginationBar
            page={safePage}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
            compact
            className="gap-1.5"
            navClassName="gap-1"
          />
        </div>
      )}
    </FilterDropdown>
  );
}
