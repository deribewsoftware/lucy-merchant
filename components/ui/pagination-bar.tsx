import Link from "next/link";

type Variant = "daisy" | "admin";

export function PaginationBar({
  page,
  pageSize,
  total,
  buildHref,
  variant = "daisy",
  className,
}: {
  page: number;
  pageSize: number;
  total: number;
  buildHref: (page: number) => string;
  variant?: Variant;
  className?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const p = Math.min(Math.max(1, page), totalPages);
  if (totalPages <= 1) return null;

  const navClass =
    className ??
    (variant === "daisy"
      ? "mt-8 flex flex-wrap items-center justify-center gap-2"
      : "mt-6 flex flex-wrap items-center justify-center gap-2");

  const linkClass =
    variant === "daisy"
      ? "btn btn-sm btn-outline"
      : "rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800/80";

  const disabledClass =
    variant === "daisy"
      ? "btn btn-sm btn-disabled btn-outline pointer-events-none"
      : "cursor-not-allowed rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-400 dark:border-zinc-800 dark:text-zinc-600";

  const metaClass =
    variant === "daisy"
      ? "px-3 text-sm text-base-content/70"
      : "px-3 text-sm text-zinc-600 dark:text-zinc-400";

  return (
    <nav className={navClass} aria-label="Pagination">
      {p > 1 ? (
        <Link href={buildHref(p - 1)} className={linkClass}>
          Previous
        </Link>
      ) : (
        <span className={disabledClass}>Previous</span>
      )}
      <span className={metaClass}>
        Page {p} of {totalPages}
      </span>
      {p < totalPages ? (
        <Link href={buildHref(p + 1)} className={linkClass}>
          Next
        </Link>
      ) : (
        <span className={disabledClass}>Next</span>
      )}
    </nav>
  );
}
