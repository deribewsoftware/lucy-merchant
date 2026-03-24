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
};

export function NavCategoryDropdown({ categories, className = "" }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const browseCategoryId = searchParams.get("category") ?? "";
  const categoriesActive =
    pathname === "/browse" && browseCategoryId.length > 0;

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(s));
  }, [categories, q]);

  const close = useCallback(() => {
    setOpen(false);
    setQ("");
  }, []);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

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

  if (categories.length === 0) return null;

  return (
    <div ref={rootRef} className={clsx("relative", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Browse categories"
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          "relative flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[13px] font-medium outline-none transition-colors",
          "focus-visible:ring-2 focus-visible:ring-secondary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-base-100",
          open || categoriesActive
            ? "border-secondary/40 bg-secondary/10 text-secondary"
            : "border-transparent text-base-content/65 hover:border-secondary/25 hover:bg-secondary/5 hover:text-base-content",
        )}
      >
        <FolderTree className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
        <span className="hidden xl:inline">Categories</span>
        <span className="xl:hidden">Cats</span>
        <ChevronDown
          className={clsx(
            "h-3.5 w-3.5 shrink-0 opacity-55 transition-transform duration-200",
            open && "rotate-180",
          )}
          strokeWidth={2.5}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Category list"
          className="absolute left-0 top-[calc(100%+8px)] z-[100] flex w-[min(calc(100vw-2rem),18rem)] flex-col overflow-hidden rounded-2xl border border-base-300/90 bg-base-100 shadow-2xl ring-1 ring-base-content/5 sm:w-72"
        >
          <div className="border-b border-base-300/70 bg-base-200/40 px-3 py-2.5">
            <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-wider text-base-content/50">
              Filter list
            </p>
            <label className="relative block">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/40"
                strokeWidth={2.25}
                aria-hidden
              />
              <input
                ref={inputRef}
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search categories…"
                className="input input-sm h-9 w-full rounded-xl border-base-300/80 bg-base-100 pl-9 text-sm placeholder:text-base-content/40 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
          </div>
          <ul
            className="max-h-[min(50vh,16rem)] overflow-y-auto overscroll-contain py-1.5"
            role="listbox"
          >
            <li role="option">
              <Link
                href="/browse"
                onClick={close}
                className={clsx(
                  "mx-1.5 flex items-center rounded-lg px-3 py-2.5 text-sm transition-colors",
                  pathname === "/browse" && !browseCategoryId
                    ? "bg-primary/12 font-semibold text-primary"
                    : "text-base-content/80 hover:bg-base-200/90",
                )}
              >
                All categories
              </Link>
            </li>
            {filtered.map((c) => {
              const active = browseCategoryId === c.id;
              return (
                <li key={c.id} role="option">
                  <Link
                    href={`/browse?category=${encodeURIComponent(c.id)}`}
                    onClick={close}
                    className={clsx(
                      "mx-1.5 flex items-center rounded-lg px-3 py-2.5 text-sm transition-colors",
                      active
                        ? "bg-primary/12 font-semibold text-primary"
                        : "text-base-content/80 hover:bg-base-200/90",
                    )}
                  >
                    <span className="truncate">{c.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          {filtered.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-base-content/50">
              No categories match “{q.trim()}”.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
