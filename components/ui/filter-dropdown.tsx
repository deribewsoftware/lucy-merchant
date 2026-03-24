"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { HiChevronDown } from "react-icons/hi2";

type Item = {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  active?: boolean;
};

type Props = {
  label: string;
  /** Short label shown on the trigger when closed (e.g. current selection) */
  valueLabel: string;
  items: Item[];
  onSelect: (id: string) => void;
  /** Narrow min width for trigger */
  className?: string;
  /** Menu aligns under trigger */
  align?: "start" | "end";
  disabled?: boolean;
  size?: "sm" | "md";
};

/**
 * Accessible filter-style dropdown (not a native &lt;select&gt;): keyboard-friendly,
 * closes on outside click / Escape.
 */
export function FilterDropdown({
  label,
  valueLabel,
  items,
  onSelect,
  className = "",
  align = "start",
  disabled = false,
  size = "sm",
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const sizeCls =
    size === "md"
      ? "min-h-11 px-3.5 text-sm"
      : "min-h-9 px-2.5 text-xs sm:text-sm";

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`${label}: ${valueLabel}`}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`flex w-full max-w-[11rem] items-center justify-between gap-2 rounded-lg border border-base-300/80 bg-base-200/40 font-medium text-base-content transition hover:border-primary/30 hover:bg-base-200/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-50 sm:max-w-[13rem] ${sizeCls}`}
      >
        <span className="min-w-0 truncate text-left">
          <span className="block truncate font-semibold text-base-content">
            {valueLabel}
          </span>
          <span className="hidden text-[0.65rem] font-normal uppercase tracking-wider text-base-content/45 sm:block">
            {label}
          </span>
        </span>
        <HiChevronDown
          className={`h-4 w-4 shrink-0 opacity-60 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={label}
          className={`absolute top-[calc(100%+6px)] z-[140] max-h-72 min-w-[14rem] max-w-[min(100vw-2rem,20rem)] overflow-y-auto overscroll-contain rounded-xl border border-base-300 bg-base-100 p-1.5 shadow-xl ${
            align === "end" ? "right-0" : "left-0"
          }`}
        >
          {items.map((item) => (
            <li key={item.id} role="option" aria-selected={item.active}>
              <button
                type="button"
                className={`flex w-full items-start gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-base-200 ${
                  item.active ? "bg-primary/10 font-semibold text-primary" : ""
                }`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect(item.id);
                  setOpen(false);
                }}
              >
                {item.icon && (
                  <span className="mt-0.5 shrink-0 opacity-80">{item.icon}</span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block leading-snug">{item.label}</span>
                  {item.description && (
                    <span className="mt-0.5 block text-xs font-normal text-base-content/55">
                      {item.description}
                    </span>
                  )}
                </span>
                {item.active && (
                  <span className="shrink-0 text-primary" aria-hidden>
                    ✓
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
