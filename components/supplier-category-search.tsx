"use client";

import clsx from "clsx";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";
import type { Category } from "@/lib/domain/types";
import { supplierLabelClass } from "@/components/supplier/form-styles";

type Props = {
  categories: Category[];
  value: string;
  onChange: (categoryId: string) => void;
  /** Optional id for the search input (e.g. from useId in parent). */
  inputId?: string;
};

export function SupplierCategorySearch({
  categories,
  value,
  onChange,
  inputId: inputIdProp,
}: Props) {
  const genId = useId();
  const searchId = inputIdProp ?? `${genId}-category-search`;
  const listId = `${searchId}-listbox`;
  const rootRef = useRef<HTMLDivElement>(null);

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const selected = useMemo(
    () => categories.find((c) => c.id === value),
    [categories, value],
  );

  const filtered = useMemo(() => {
    const f = q.trim().toLowerCase();
    if (!f) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(f));
  }, [categories, q]);

  useEffect(() => {
    function onDoc(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onDoc, true);
    return () => document.removeEventListener("pointerdown", onDoc, true);
  }, []);

  function pick(c: Category) {
    onChange(c.id);
    setQ("");
    setOpen(false);
  }

  const inputClass =
    "w-full rounded-xl border border-base-300 bg-base-100 py-2.5 pl-10 pr-3.5 text-sm text-base-content shadow-sm outline-none transition placeholder:text-base-content/40 focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <div ref={rootRef} className="flex flex-col gap-2">
      <label className={supplierLabelClass} htmlFor={searchId}>
        Category
      </label>
      {selected ? (
        <p className="text-[13px] text-base-content/75">
          Selected:{" "}
          <span className="font-semibold text-base-content">{selected.name}</span>
        </p>
      ) : (
        <p className="text-[12px] text-base-content/55">
          Search by name and choose a category.
        </p>
      )}

      <div className="relative mt-1">
        <HiOutlineMagnifyingGlass
          className="pointer-events-none absolute left-3 top-1/2 z-[1] h-5 w-5 -translate-y-1/2 text-base-content/35"
          aria-hidden
        />
        <input
          id={searchId}
          type="search"
          role="combobox"
          autoComplete="off"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className={inputClass}
          placeholder="Search categories…"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
        />
      </div>

      {open && categories.length === 0 ? (
        <p className="rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-base-content">
          No categories are available yet.
        </p>
      ) : null}

      {open && categories.length > 0 && filtered.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="max-h-56 overflow-auto rounded-xl border border-base-300 bg-base-100 py-1 shadow-lg shadow-base-content/[0.06] ring-1 ring-base-300/50"
        >
          {filtered.map((c) => {
            const isSel = c.id === value;
            return (
              <li key={c.id} role="option" aria-selected={isSel}>
                <button
                  type="button"
                  className={clsx(
                    "w-full px-3.5 py-2.5 text-left text-sm transition",
                    isSel
                      ? "bg-primary/12 font-semibold text-base-content"
                      : "text-base-content hover:bg-primary/10 active:bg-primary/15",
                  )}
                  onClick={() => pick(c)}
                >
                  {c.name}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {open &&
      categories.length > 0 &&
      q.trim() !== "" &&
      filtered.length === 0 ? (
        <p className="rounded-xl border border-base-300/80 bg-base-200/30 px-3 py-2 text-sm text-base-content/65">
          No categories match “{q.trim()}”.
        </p>
      ) : null}
    </div>
  );
}
