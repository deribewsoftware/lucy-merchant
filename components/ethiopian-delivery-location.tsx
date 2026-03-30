"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  nominatimToParts,
  type EthiopiaSearchHit,
} from "@/lib/location/ethiopia-location";

type Props = {
  value: string;
  onChange: (text: string) => void;
  label: string;
  required?: boolean;
  helperText?: string;
  variant?: "daisy" | "zinc";
  inputId?: string;
};

function inputClasses(variant: "daisy" | "zinc"): string {
  if (variant === "daisy") {
    return "input input-bordered w-full rounded-lg border-base-300 bg-base-100 text-base-content placeholder:text-base-content/40";
  }
  return "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500";
}

function labelClasses(variant: "daisy" | "zinc"): string {
  if (variant === "daisy") {
    return "label-text font-medium text-base-content";
  }
  return "text-sm font-medium text-zinc-700 dark:text-zinc-300";
}

function composeLine(parts: {
  region: string;
  town: string;
  city: string;
  street: string;
}): string {
  return [parts.region, parts.town, parts.city, parts.street]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(", ");
}

export function EthiopianDeliveryLocation({
  value,
  onChange,
  label,
  required,
  helperText,
  variant = "daisy",
  inputId: inputIdProp,
}: Props) {
  const genId = useId();
  const searchId = inputIdProp ?? `${genId}-eth-search`;

  const [region, setRegion] = useState("");
  const [town, setTown] = useState("");
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");

  const [searchQ, setSearchQ] = useState("");

  useEffect(() => {
    if (!value.trim()) {
      setRegion("");
      setTown("");
      setCity("");
      setStreet("");
      setSearchQ("");
    }
  }, [value]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hits, setHits] = useState<EthiopiaSearchHit[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const v = variant;

  const composed = useMemo(
    () => composeLine({ region, town, city, street }),
    [region, town, city, street],
  );

  useEffect(() => {
    onChange(composed);
  }, [composed, onChange]);

  const applyHit = useCallback((hit: EthiopiaSearchHit) => {
    const p = nominatimToParts(hit.address);
    setRegion(p.region);
    setTown(p.town);
    setCity(p.city);
    setStreet(p.street);
    setSearchQ(hit.displayName);
    setOpen(false);
    setHits([]);
    setErr(null);
  }, []);

  useEffect(() => {
    const q = searchQ.trim();
    if (q.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      debounceRef.current = null;
      try {
        const res = await fetch(
          `/api/location/ethiopia-search?q=${encodeURIComponent(q)}`,
          { credentials: "include" },
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setErr(
            typeof data.error === "string"
              ? data.error
              : "Search failed. Try again.",
          );
          setHits([]);
          return;
        }
        setHits(
          Array.isArray(data.results) ? (data.results as EthiopiaSearchHit[]) : [],
        );
      } catch {
        setErr("Search failed. Check your connection.");
        setHits([]);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQ]);

  useEffect(() => {
    function onDocPointer(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onDocPointer, true);
    return () => document.removeEventListener("pointerdown", onDocPointer, true);
  }, []);

  const clearAll = useCallback(() => {
    setRegion("");
    setTown("");
    setCity("");
    setStreet("");
    setSearchQ("");
    setHits([]);
    setOpen(false);
    setErr(null);
  }, []);

  const hintFoot =
    v === "daisy"
      ? "text-[11px] leading-snug text-base-content/50"
      : "text-[11px] leading-snug text-zinc-500 dark:text-zinc-400";

  return (
    <div ref={rootRef} className="form-control w-full gap-2">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <label className="label min-h-0 flex-1 py-0" htmlFor={searchId}>
          <span className={labelClasses(v)}>{label}</span>
        </label>
        <button
          type="button"
          onClick={clearAll}
          className={
            v === "daisy"
              ? "btn btn-ghost btn-sm shrink-0 text-base-content/70"
              : "shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
          }
        >
          Clear location
        </button>
      </div>
      {helperText ? (
        <p
          className={
            v === "daisy"
              ? "text-xs text-base-content/60"
              : "text-xs text-zinc-500 dark:text-zinc-400"
          }
        >
          {helperText}
        </p>
      ) : null}

      <div className="relative">
        <input
          id={searchId}
          type="search"
          autoComplete="off"
          value={searchQ}
          onChange={(e) => {
            setSearchQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className={inputClasses(v)}
          placeholder="Search places in Ethiopia…"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${searchId}-listbox`}
          aria-required={required}
        />
        {loading ? (
          <span
            className={
              v === "daisy"
                ? "absolute right-3 top-1/2 -translate-y-1/2 text-xs text-base-content/50"
                : "absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400"
            }
          >
            Searching…
          </span>
        ) : null}
        {open && hits.length > 0 ? (
          <ul
            id={`${searchId}-listbox`}
            role="listbox"
            className={
              v === "daisy"
                ? "absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-base-300 bg-base-100 py-1 shadow-lg dark:border-zinc-700"
                : "absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-950"
            }
          >
            {hits.map((h, i) => (
              <li key={`${h.lat}-${h.lon}-${i}`} role="option">
                <button
                  type="button"
                  className={
                    v === "daisy"
                      ? "w-full px-3 py-2 text-left text-sm text-base-content hover:bg-base-200"
                      : "w-full px-3 py-2 text-left text-sm text-zinc-900 hover:bg-zinc-100 dark:text-zinc-50 dark:hover:bg-zinc-800"
                  }
                  onClick={() => applyHit(h)}
                >
                  {h.displayName}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {err ? (
        <p className="text-xs text-error">{err}</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="form-control gap-1">
          <label className="label py-0" htmlFor={`${searchId}-region`}>
            <span className={labelClasses(v)}>Region</span>
          </label>
          <input
            id={`${searchId}-region`}
            type="text"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className={inputClasses(v)}
            placeholder="e.g. Oromia"
          />
        </div>
        <div className="form-control gap-1">
          <label className="label py-0" htmlFor={`${searchId}-town`}>
            <span className={labelClasses(v)}>Town</span>
          </label>
          <input
            id={`${searchId}-town`}
            type="text"
            value={town}
            onChange={(e) => setTown(e.target.value)}
            className={inputClasses(v)}
            placeholder="Town or subcity"
          />
        </div>
        <div className="form-control gap-1">
          <label className="label py-0" htmlFor={`${searchId}-city`}>
            <span className={labelClasses(v)}>City</span>
          </label>
          <input
            id={`${searchId}-city`}
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={inputClasses(v)}
            placeholder="City"
          />
        </div>
        <div className="form-control gap-1 sm:col-span-2">
          <label className="label py-0" htmlFor={`${searchId}-street`}>
            <span className={labelClasses(v)}>Street &amp; details</span>
          </label>
          <input
            id={`${searchId}-street`}
            type="text"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            className={inputClasses(v)}
            placeholder="Street, building, gate…"
          />
        </div>
      </div>

      <p className={hintFoot}>
        Pick a suggestion to fill the fields, then edit any line. Your saved
        address is: region, town, city, street (in that order).
      </p>
    </div>
  );
}
