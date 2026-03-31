import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";
import {
  clampPage,
  totalPagesFor,
  visiblePaginationItems,
  type PaginationItem,
} from "@/lib/utils/pagination";

const pillBase =
  "inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border text-sm font-medium tabular-nums transition-colors";
const pillIdle =
  "border-border/45 bg-card text-foreground hover:border-primary/35 hover:bg-muted/30";
const pillActive =
  "border-primary/40 bg-primary/10 font-semibold text-primary ring-1 ring-primary/20";
const pillDisabled = "cursor-not-allowed border-border/45 bg-card/50 opacity-50";

const navButtonBase =
  "inline-flex h-10 shrink-0 items-center gap-1 rounded-xl border px-3 text-sm font-medium transition-colors sm:px-4";

type PaginationBarBase = {
  page: number;
  pageSize: number;
  total: number;
  className?: string;
  /** Extra classes for the inner flex row (gap, alignment). */
  navClassName?: string;
  /** Hide numbered page buttons (prev/next + compact “Page x of y” only). */
  compact?: boolean;
};

type PaginationBarLink = PaginationBarBase & {
  buildHref: (page: number) => string;
  onPageChange?: undefined;
};

type PaginationBarButton = PaginationBarBase & {
  buildHref?: undefined;
  onPageChange: (page: number) => void;
};

export type PaginationBarProps = PaginationBarLink | PaginationBarButton;

function PageNumber({
  item,
  currentPage,
  buildHref,
  onPageChange,
}: {
  item: PaginationItem;
  currentPage: number;
  buildHref?: (page: number) => string;
  onPageChange?: (page: number) => void;
}) {
  if (item === "ellipsis") {
    return (
      <span
        className="inline-flex min-w-10 items-center justify-center text-sm text-muted-foreground"
        aria-hidden
      >
        …
      </span>
    );
  }
  const active = item === currentPage;
  if (onPageChange) {
    return (
      <button
        type="button"
        onClick={() => onPageChange(item)}
        disabled={active}
        aria-current={active ? "page" : undefined}
        className={clsx(pillBase, active ? pillActive : pillIdle)}
      >
        {item}
      </button>
    );
  }
  if (buildHref) {
    return (
      <Link
        href={buildHref(item)}
        aria-current={active ? "page" : undefined}
        className={clsx(pillBase, active ? pillActive : pillIdle)}
      >
        {item}
      </Link>
    );
  }
  return null;
}

/**
 * Accessible pagination: previous/next plus page numbers with ellipsis.
 * Use `buildHref` for URL-based lists; use `onPageChange` for client-only lists.
 */
export function PaginationBar(props: PaginationBarProps) {
  const { page, pageSize, total, className, navClassName, compact = false } = props;
  const buildHref = "buildHref" in props ? props.buildHref : undefined;
  const onPageChange = "onPageChange" in props ? props.onPageChange : undefined;

  const totalPages = totalPagesFor(total, pageSize);
  const p = clampPage(page, total, pageSize);
  if (totalPages <= 1) return null;

  const items = visiblePaginationItems(p, totalPages);

  return (
    <nav
      className={clsx(
        "flex flex-wrap items-center justify-center gap-2 sm:gap-3",
        className,
      )}
      aria-label="Pagination"
    >
      {buildHref && !onPageChange ? (
        p > 1 ? (
          <Link
            href={buildHref(p - 1)}
            className={clsx(
              navButtonBase,
              "border-border/45 bg-card text-foreground hover:border-primary/30 hover:bg-muted",
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Link>
        ) : (
          <span className={clsx(navButtonBase, pillDisabled, "text-muted-foreground")}>
            <ChevronLeft className="h-4 w-4" />
            Previous
          </span>
        )
      ) : onPageChange ? (
        <button
          type="button"
          onClick={() => onPageChange(p - 1)}
          disabled={p <= 1}
          className={clsx(
            navButtonBase,
            p > 1
              ? "border-border/45 bg-card text-foreground hover:border-primary/30 hover:bg-muted"
              : clsx(pillDisabled, "text-muted-foreground"),
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>
      ) : null}

      {!compact && (
        <div className={clsx("flex flex-wrap items-center justify-center gap-1.5", navClassName)}>
          {items.map((item, idx) => (
            <PageNumber
              key={item === "ellipsis" ? `e-${idx}` : item}
              item={item}
              currentPage={p}
              buildHref={buildHref}
              onPageChange={onPageChange}
            />
          ))}
        </div>
      )}

      {compact && (
        <span className="px-3 text-sm tabular-nums text-muted-foreground">
          Page <span className="font-medium text-foreground">{p}</span> of{" "}
          <span className="font-medium text-foreground">{totalPages}</span>
        </span>
      )}

      {buildHref && !onPageChange ? (
        p < totalPages ? (
          <Link
            href={buildHref(p + 1)}
            className={clsx(
              navButtonBase,
              "border-border/45 bg-card text-foreground hover:border-primary/30 hover:bg-muted",
            )}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className={clsx(navButtonBase, pillDisabled, "text-muted-foreground")}>
            Next
            <ChevronRight className="h-4 w-4" />
          </span>
        )
      ) : onPageChange ? (
        <button
          type="button"
          onClick={() => onPageChange(p + 1)}
          disabled={p >= totalPages}
          className={clsx(
            navButtonBase,
            p < totalPages
              ? "border-border/45 bg-card text-foreground hover:border-primary/30 hover:bg-muted"
              : clsx(pillDisabled, "text-muted-foreground"),
          )}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      ) : null}
    </nav>
  );
}

export function PaginationSummary({
  page,
  pageSize,
  total,
  className,
  /** Appended after the total count (e.g. &quot;products&quot;, &quot;in this filter&quot;). */
  suffix,
}: {
  page: number;
  pageSize: number;
  total: number;
  className?: string;
  suffix?: ReactNode;
}) {
  if (total <= 0) {
    return (
      <p className={clsx("text-sm text-muted-foreground", className)}>No results</p>
    );
  }
  const safe = clampPage(page, total, pageSize);
  const start = (safe - 1) * pageSize + 1;
  const end = Math.min(safe * pageSize, total);
  return (
    <p className={clsx("text-sm tabular-nums text-muted-foreground", className)}>
      Showing{" "}
      <span className="font-medium text-foreground">{start}</span>
      –
      <span className="font-medium text-foreground">{end}</span> of{" "}
      <span className="font-medium text-foreground">{total}</span>
      {suffix != null && suffix !== "" ? (
        <span className="font-normal text-muted-foreground"> {suffix}</span>
      ) : null}
    </p>
  );
}

export { formatPaginationRange } from "@/lib/utils/pagination";
