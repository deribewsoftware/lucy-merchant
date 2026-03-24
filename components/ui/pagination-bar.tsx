import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function PaginationBar({
  page,
  pageSize,
  total,
  buildHref,
  className,
}: {
  page: number;
  pageSize: number;
  total: number;
  buildHref: (page: number) => string;
  className?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const p = Math.min(Math.max(1, page), totalPages);
  if (totalPages <= 1) return null;

  return (
    <nav
      className={className ?? "mt-8 flex flex-wrap items-center justify-center gap-2"}
      aria-label="Pagination"
    >
      {p > 1 ? (
        <Link
          href={buildHref(p - 1)}
          className="flex h-10 items-center gap-1 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-muted"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Link>
      ) : (
        <span className="flex h-10 cursor-not-allowed items-center gap-1 rounded-lg border border-border bg-card/50 px-4 text-sm font-medium text-muted-foreground opacity-50">
          <ChevronLeft className="h-4 w-4" />
          Previous
        </span>
      )}
      
      <span className="px-3 text-sm text-muted-foreground">
        Page <span className="font-medium text-foreground">{p}</span> of{" "}
        <span className="font-medium text-foreground">{totalPages}</span>
      </span>
      
      {p < totalPages ? (
        <Link
          href={buildHref(p + 1)}
          className="flex h-10 items-center gap-1 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-muted"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className="flex h-10 cursor-not-allowed items-center gap-1 rounded-lg border border-border bg-card/50 px-4 text-sm font-medium text-muted-foreground opacity-50">
          Next
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
