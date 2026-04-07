"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Search, Tags, X } from "lucide-react";
import { HiOutlineArrowPath } from "react-icons/hi2";
import clsx from "clsx";
import { MAX_COMPANY_RECOMMENDATION_CATEGORIES } from "@/lib/domain/company-recommendation-categories";
import {
  supplierGhostButtonClass,
  supplierInputClass,
  supplierPrimaryButtonClass,
} from "@/components/supplier/form-styles";

type Cat = { id: string; name: string };

export function CompanyRecommendationCategoriesField({
  value,
  onChange,
  disabled = false,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  const [cats, setCats] = useState<Cat[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/categories");
        const data = (await res.json()) as { categories?: Cat[] };
        if (!cancelled && Array.isArray(data.categories)) {
          setCats(
            [...data.categories].sort((a, b) =>
              a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
            ),
          );
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onPointerDown(e: PointerEvent) {
      const el = panelRef.current;
      if (el && !el.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return cats;
    return cats.filter((c) => c.name.toLowerCase().includes(s));
  }, [cats, q]);

  const selected = useMemo(() => {
    const m = new Map(cats.map((c) => [c.id, c.name]));
    return value.map((id) => ({ id, name: m.get(id) ?? id }));
  }, [cats, value]);

  function toggle(id: string) {
    if (disabled) return;
    if (value.includes(id)) {
      onChange(value.filter((x) => x !== id));
    } else if (value.length < MAX_COMPANY_RECOMMENDATION_CATEGORIES) {
      onChange([...value, id]);
    }
  }

  const atCap = value.length >= MAX_COMPANY_RECOMMENDATION_CATEGORIES;

  return (
    <div ref={panelRef} className="relative space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-base-content/45">
          Selected · {value.length}/{MAX_COMPANY_RECOMMENDATION_CATEGORIES}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {value.length > 0 ? (
            <button
              type="button"
              disabled={disabled}
              className="text-xs font-semibold text-primary/80 underline-offset-2 hover:underline disabled:opacity-40"
              onClick={() => onChange([])}
            >
              Clear all
            </button>
          ) : null}
          <button
            type="button"
            disabled={disabled}
            aria-expanded={open}
            aria-controls="company-rec-categories-panel"
            className={clsx(
              supplierGhostButtonClass,
              "gap-1.5 py-2 pl-3 pr-2 text-xs font-semibold",
              open && "border-primary/40 bg-primary/[0.06]",
            )}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Close list" : value.length ? "Edit categories" : "Browse categories"}
            <ChevronDown
              className={clsx("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")}
              strokeWidth={2.25}
              aria-hidden
            />
          </button>
        </div>
      </div>

      {selected.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {selected.map((s) => (
            <li key={s.id}>
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                <span className="max-w-[14rem] truncate">{s.name}</span>
                <button
                  type="button"
                  disabled={disabled}
                  className="rounded-full p-0.5 hover:bg-primary/20 disabled:opacity-40"
                  aria-label={`Remove ${s.name}`}
                  onClick={() => onChange(value.filter((x) => x !== s.id))}
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-base-content/55">
          Optional — open the list below, search, and tap categories to add up to five.
        </p>
      )}

      {open ? (
        <div
          id="company-rec-categories-panel"
          className="absolute left-0 right-0 top-full z-40 mt-2 rounded-xl border border-base-300/90 bg-base-100 p-3 shadow-xl shadow-base-content/[0.06] ring-1 ring-base-300/40"
        >
          <label className="relative block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/40"
              strokeWidth={2.25}
              aria-hidden
            />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              disabled={disabled}
              placeholder="Search catalog categories…"
              className={`${supplierInputClass} pl-10`}
              autoFocus
            />
          </label>

          <div
            className={clsx(
              "mt-3 max-h-[min(40vh,14rem)] overflow-y-auto overscroll-contain rounded-lg border border-base-300/70 bg-base-200/25 p-1.5",
              disabled && "opacity-60",
            )}
            role="listbox"
            aria-label="Catalog categories"
            aria-multiselectable
          >
            <ul className="flex flex-col gap-0.5">
              {filtered.map((c) => {
                const active = value.includes(c.id);
                const blocked = !active && atCap;
                return (
                  <li key={c.id} role="option" aria-selected={active}>
                    <button
                      type="button"
                      disabled={disabled || blocked}
                      onClick={() => toggle(c.id)}
                      className={clsx(
                        "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition",
                        active
                          ? "bg-primary/15 font-semibold text-primary"
                          : "hover:bg-base-200/90",
                        blocked && !active && "cursor-not-allowed opacity-45",
                      )}
                    >
                      <span className="min-w-0 truncate">{c.name}</span>
                      {active ? (
                        <span className="shrink-0 text-[11px] font-medium text-primary/80">
                          Selected
                        </span>
                      ) : blocked ? (
                        <span className="shrink-0 text-[10px] text-base-content/48">
                          Max {MAX_COMPANY_RECOMMENDATION_CATEGORIES}
                        </span>
                      ) : (
                        <span className="shrink-0 text-[11px] text-base-content/40">
                          Add
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            {cats.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-base-content/50">
                Loading categories…
              </p>
            ) : filtered.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-base-content/50">
                No categories match “{q.trim()}”.
              </p>
            ) : null}
          </div>
          <p className="mt-2 text-center text-[11px] text-base-content/45">
            Click outside or press Esc to close. Selections are saved in the form.
          </p>
        </div>
      ) : null}
    </div>
  );
}

/** Editable block for verified suppliers — only PATCHes recommendation categories. */
export function SupplierCompanyRecommendationEditor({
  companyId,
  initialIds,
}: {
  companyId: string;
  initialIds: string[];
}) {
  const router = useRouter();
  const [ids, setIds] = useState<string[]>(initialIds);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    setIds(initialIds);
  }, [initialIds]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function onSave() {
    setLoading(true);
    setMsg(null);
    setToast(null);
    try {
      const res = await fetch(`/api/companies/${companyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendationCategoryIds: ids }),
        credentials: "same-origin",
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        const err = data.error ?? "Could not save";
        setMsg(err);
        setToast({ kind: "error", text: err });
        return;
      }
      setMsg(null);
      setToast({ kind: "success", text: "Trade focus saved." });
      router.refresh();
    } catch {
      const err = "Network error. Try again.";
      setMsg(err);
      setToast({ kind: "error", text: err });
    } finally {
      setLoading(false);
    }
  }

  const dirty =
    JSON.stringify([...ids].sort()) !== JSON.stringify([...initialIds].sort());

  return (
    <div className="relative rounded-2xl border border-accent/25 bg-gradient-to-br from-base-100 via-base-100 to-accent/[0.06] p-5 shadow-sm sm:p-6">
      {toast ? (
        <div
          className="toast toast-top toast-center z-[100] max-w-[min(100%,24rem)] px-2 sm:toast-end"
          role="status"
          aria-live="polite"
        >
          <div
            className={
              toast.kind === "success"
                ? "alert alert-success shadow-lg"
                : "alert alert-error shadow-lg"
            }
          >
            <span className="text-sm">{toast.text}</span>
          </div>
        </div>
      ) : null}
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent">
          <Tags className="h-5 w-5" strokeWidth={2.25} />
        </span>
        <div>
          <h3 className="font-display text-base font-bold text-base-content sm:text-lg">
            Trade focus categories
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-base-content/70">
            Choose up to five catalog categories. They power search and the home
            “Recommended for you” strip when your products match.
          </p>
        </div>
      </div>

      <CompanyRecommendationCategoriesField value={ids} onChange={setIds} />

      {msg ? (
        <p className="mt-4 text-sm text-error" role="alert">
          {msg}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={loading || !dirty}
          aria-busy={loading}
          onClick={onSave}
          className={`${supplierPrimaryButtonClass} min-w-[10.5rem]`}
        >
          {loading ? (
            <HiOutlineArrowPath className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
          ) : null}
          {loading ? "Saving…" : "Save trade focus"}
        </button>
        <button
          type="button"
          disabled={loading || !dirty}
          onClick={() => {
            setIds(initialIds);
            setMsg(null);
          }}
          className={supplierGhostButtonClass}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
