"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  HiOutlineChevronDown,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
} from "react-icons/hi2";
import clsx from "clsx";
import type { Category } from "@/lib/domain/types";

type Props = {
  options: Category[];
  value: string;
  onChange: (parentId: string) => void;
  /** First option label when no parent is selected */
  rootOptionLabel?: string;
  /** Tighter layout for inline edit rows */
  compact?: boolean;
  disabled?: boolean;
};

/**
 * Parent selector: opens a dropdown with search at the top (when needed) and
 * top-level first in the list.
 */
export function ParentCategoryPicker({
  options,
  value,
  onChange,
  rootOptionLabel = "Top-level category",
  compact = false,
  disabled = false,
}: Props) {
  const baseId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const optKey = options.map((o) => o.id).join(",");
  useEffect(() => {
    setQuery("");
  }, [optKey]);

  useEffect(() => {
    if (!open) return;
    searchInputRef.current?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = q
      ? options.filter(
          (c) =>
            c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q),
        )
      : options;
    const selected = value ? options.find((c) => c.id === value) : null;
    if (selected && !list.some((c) => c.id === selected.id)) {
      list = [selected, ...list];
    }
    return list;
  }, [options, query, value]);

  const total = options.length;
  const shown = filtered.length;
  const isFiltering = query.trim().length > 0;
  const showSearchInPanel = total > 1;

  const displayLabel =
    value === ""
      ? rootOptionLabel
      : (options.find((c) => c.id === value)?.name ?? rootOptionLabel);

  const triggerClass =
    "flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-base-300 bg-base-100 px-3 text-left text-sm font-normal shadow-sm outline-none transition hover:bg-base-200/40 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50";

  const buttonClass = compact
    ? clsx(triggerClass, "h-10 max-w-md py-2")
    : clsx(triggerClass, "min-h-11 py-2.5");

  if (total === 0) {
    return (
      <div className={compact ? "max-w-md" : ""}>
        <button
          type="button"
          disabled={disabled}
          className={clsx(buttonClass, "pointer-events-none cursor-default opacity-80")}
          aria-label="Parent category"
        >
          <span className="truncate">{rootOptionLabel}</span>
          <HiOutlineChevronDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
        </button>
        {!compact ? (
          <p className="mt-2 text-xs text-base-content/50">
            No other categories can be a parent yet — this node stays top-level until
            you add more categories.
          </p>
        ) : null}
      </div>
    );
  }

  function pick(id: string) {
    onChange(id);
    setOpen(false);
    setQuery("");
  }

  function toggleOpen() {
    if (disabled) return;
    setOpen((o) => !o);
    if (open) setQuery("");
  }

  return (
    <div ref={containerRef} className={clsx("relative w-full", compact && "max-w-md")}>
      <button
        type="button"
        id={`${baseId}-trigger`}
        disabled={disabled}
        onClick={toggleOpen}
        onKeyDown={(e) => {
          if (e.key === "Escape" && open) {
            e.preventDefault();
            setOpen(false);
            setQuery("");
          }
        }}
        className={buttonClass}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={`${baseId}-listbox`}
      >
        <span className="min-w-0 flex-1 truncate">{displayLabel}</span>
        <HiOutlineChevronDown
          className={clsx(
            "h-4 w-4 shrink-0 opacity-50 transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          id={`${baseId}-listbox`}
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-1 flex max-h-[min(22rem,calc(100vh-8rem))] flex-col overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-lg ring-1 ring-base-300/20"
        >
          {showSearchInPanel ? (
            <div className="shrink-0 border-b border-base-300/80 bg-base-200/30 p-2">
              <label
                className="input input-bordered input-sm flex w-full min-w-0 items-center gap-2 border-base-300 bg-base-100"
                htmlFor={`${baseId}-search`}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <HiOutlineMagnifyingGlass
                  className="h-3.5 w-3.5 shrink-0 text-base-content/40"
                  aria-hidden
                />
                <input
                  ref={searchInputRef}
                  id={`${baseId}-search`}
                  type="search"
                  className="grow bg-transparent text-sm outline-none placeholder:text-base-content/40"
                  placeholder="Search categories…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Escape") {
                      e.preventDefault();
                      setQuery("");
                    }
                  }}
                  autoComplete="off"
                  aria-describedby={`${baseId}-search-status`}
                />
                {isFiltering ? (
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs shrink-0 gap-0.5 px-1"
                    onClick={(e) => {
                      e.preventDefault();
                      setQuery("");
                    }}
                    aria-label="Clear search"
                  >
                    <HiOutlineXMark className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </label>
              <p
                id={`${baseId}-search-status`}
                className="mt-1.5 px-0.5 text-[11px] text-base-content/45"
                aria-live="polite"
              >
                {isFiltering ? (
                  <>
                    <span className="font-semibold tabular-nums text-base-content/70">
                      {shown}
                    </span>{" "}
                    of {total} match{shown === 1 ? "" : "es"}
                  </>
                ) : (
                  <>
                    <span className="font-semibold tabular-nums text-base-content/70">
                      {total}
                    </span>{" "}
                    below — search to narrow
                  </>
                )}
              </p>
            </div>
          ) : null}

          <ul
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1"
            role="presentation"
          >
            <li role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={value === ""}
                className={clsx(
                  "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors",
                  value === ""
                    ? "bg-primary/12 font-medium text-primary"
                    : "text-base-content hover:bg-base-200/80",
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick("")}
              >
                <span className="truncate">{rootOptionLabel}</span>
              </button>
            </li>
            {filtered.map((c) => (
              <li key={c.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={value === c.id}
                  className={clsx(
                    "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors",
                    value === c.id
                      ? "bg-primary/12 font-medium text-primary"
                      : "text-base-content hover:bg-base-200/80",
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(c.id)}
                >
                  <span className="truncate">{c.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!compact && showSearchInPanel ? (
        <p className="mt-2 text-xs text-base-content/45">
          Open the menu to search and choose a parent. Top-level is always listed
          first.
        </p>
      ) : null}
      {!compact && !showSearchInPanel && total > 0 ? (
        <p className="mt-2 text-xs text-base-content/45">
          Only one parent exists — open the menu to pick it or top-level.
        </p>
      ) : null}
    </div>
  );
}
