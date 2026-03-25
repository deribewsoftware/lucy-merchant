"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, FolderTree, Search } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import clsx from "clsx";

export type NavCategoryItem = { id: string; name: string };

type Props = {
  categories: NavCategoryItem[];
  /** Wider panel on desktop */
  className?: string;
  /**
   * Header mobile bar: full-width trigger + bottom sheet (use only inside `md:hidden` regions).
   */
  mobileStrip?: boolean;
};

/**
 * Shared category list + search (used inside “More” menu and legacy popover).
 */
export function NavCategoryMenuBody({
  categories,
  onNavigate,
  compact = false,
}: {
  categories: NavCategoryItem[];
  onNavigate?: () => void;
  /** Tighter layout for the More dropdown panel */
  compact?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState("");

  const browseCategoryId = searchParams.get("category") ?? "";

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(s));
  }, [categories, q]);

  const linkClass = (active: boolean) =>
    clsx(
      "mx-1.5 flex items-center rounded-lg px-3 py-2.5 text-sm transition-colors",
      active
        ? "bg-primary/12 font-semibold text-primary"
        : compact
          ? "text-foreground/85 hover:bg-muted/90"
          : "text-base-content/80 hover:bg-base-200/90",
    );

  return (
    <div className={clsx(compact && "rounded-lg border border-border/40 bg-muted/20 p-2")}>
      <div
        className={clsx(
          !compact && "border-b border-base-300/70 bg-base-200/40 px-3 py-2.5",
          compact && "pb-2",
        )}
      >
        <p
          className={clsx(
            "mb-2 font-bold uppercase tracking-wider",
            compact
              ? "text-[0.6rem] text-muted-foreground"
              : "text-[0.65rem] text-base-content/50",
          )}
        >
          {compact ? "Categories" : "Filter list"}
        </p>
        <label className="relative block">
          <Search
            className={clsx(
              "pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2",
              compact ? "text-muted-foreground" : "text-base-content/40",
            )}
            strokeWidth={2.25}
            aria-hidden
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search categories…"
            className={clsx(
              "h-9 w-full rounded-xl border pl-9 text-sm placeholder:opacity-60 focus:outline-none focus:ring-2",
              compact
                ? "border-border/60 bg-background/80 focus:border-primary/40 focus:ring-primary/15"
                : "input input-sm border-base-300/80 bg-base-100 focus:border-primary/40 focus:ring-primary/20",
            )}
          />
        </label>
      </div>
      <ul
        className={clsx(
          "overflow-y-auto overscroll-contain py-1.5",
          compact ? "max-h-[min(40vh,14rem)]" : "max-h-[min(50vh,16rem)]",
        )}
        role="listbox"
      >
        <li
          role="option"
          aria-selected={pathname === "/browse" && browseCategoryId === ""}
        >
          <Link
            href="/browse"
            onClick={onNavigate}
            className={linkClass(
              pathname === "/browse" && browseCategoryId === "",
            )}
          >
            All categories
          </Link>
        </li>
        {filtered.map((c) => {
          const active = browseCategoryId === c.id;
          return (
            <li key={c.id} role="option" aria-selected={active}>
              <Link
                href={`/browse?category=${encodeURIComponent(c.id)}`}
                onClick={onNavigate}
                className={linkClass(active)}
              >
                <span className="truncate">{c.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      {filtered.length === 0 && (
        <p
          className={clsx(
            "px-4 py-4 text-center text-sm",
            compact ? "text-muted-foreground" : "text-base-content/50",
          )}
        >
          No categories match “{q.trim()}”.
        </p>
      )}
    </div>
  );
}

export function NavCategoryDropdown({
  categories,
  className = "",
  mobileStrip = false,
}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const browseCategoryId = searchParams.get("category") ?? "";
  const categoriesActive =
    pathname === "/browse" && browseCategoryId.length > 0;

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) close();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  useEffect(() => {
    if (!open || !mobileStrip) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, mobileStrip]);

  if (categories.length === 0) return null;

  const triggerClass = clsx(
    "relative flex items-center gap-1.5 rounded-lg border text-[13px] font-medium outline-none transition-colors",
    "focus-visible:ring-2 focus-visible:ring-secondary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-base-100",
    mobileStrip
      ? "min-h-11 w-full justify-between rounded-xl border-border/50 bg-card/90 px-3 py-2.5 text-sm shadow-sm"
      : "border px-2.5 py-1.5",
    !mobileStrip &&
      (open || categoriesActive
        ? "border-secondary/40 bg-secondary/10 text-secondary"
        : "border-transparent text-base-content/65 hover:border-secondary/25 hover:bg-secondary/5 hover:text-base-content"),
    mobileStrip &&
      (open || categoriesActive
        ? "border-primary/35 bg-primary/[0.08] text-primary"
        : "text-foreground hover:border-border/60 hover:bg-muted/60"),
  );

  return (
    <div
      ref={rootRef}
      className={clsx(mobileStrip ? "w-full" : "relative", className)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Product categories"
        onClick={() => setOpen((o) => !o)}
        className={triggerClass}
      >
        <span className="flex min-w-0 items-center gap-2">
          <FolderTree className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
          <span className={clsx("truncate font-semibold", mobileStrip && "text-[15px]")}>
            {mobileStrip ? "Categories" : (
              <>
                <span className="hidden xl:inline">Categories</span>
                <span className="xl:hidden">Cats</span>
              </>
            )}
          </span>
        </span>
        <ChevronDown
          className={clsx(
            "h-4 w-4 shrink-0 opacity-55 transition-transform duration-200",
            open && "rotate-180",
          )}
          strokeWidth={2.5}
          aria-hidden
        />
      </button>

      {open && !mobileStrip && (
        <div
          role="dialog"
          aria-label="Category list"
          className="absolute left-0 top-[calc(100%+8px)] z-[100] flex w-[min(calc(100vw-2rem),18rem)] flex-col overflow-hidden rounded-2xl border border-base-300/90 bg-base-100 shadow-2xl ring-1 ring-base-content/5 sm:w-72"
        >
          <NavCategoryMenuBody
            categories={categories}
            onNavigate={close}
            compact={false}
          />
        </div>
      )}

      {open && mobileStrip && (
        <>
          <div
            className="fixed inset-0 z-[199] bg-background/65 backdrop-blur-[3px]"
            aria-hidden
            onClick={close}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Category list"
            className="fixed inset-x-0 bottom-0 z-[200] flex max-h-[min(88dvh,540px)] flex-col overflow-hidden rounded-t-2xl border border-border/60 bg-card shadow-2xl"
          >
            <div className="flex shrink-0 flex-col items-center border-b border-border/40 bg-muted/30 pt-2 pb-1">
              <div className="mb-2 h-1 w-11 rounded-full bg-muted-foreground/25" aria-hidden />
              <p className="px-4 pb-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Shop by category
              </p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <NavCategoryMenuBody
                categories={categories}
                onNavigate={close}
                compact={false}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
