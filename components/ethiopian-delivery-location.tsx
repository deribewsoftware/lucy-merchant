"use client";

import clsx from "clsx";
import { HiOutlineMapPin, HiOutlineMagnifyingGlass } from "react-icons/hi2";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  nominatimToParts,
  type EthiopiaSearchHit,
} from "@/lib/location/ethiopia-location";

/**
 * Best-effort split of comma-separated saved addresses:
 * - New (5): region, city, woreda, kebele, street
 * - Legacy with town (6+): region, town, city, woreda, kebele, street — town is merged into city for display
 * - Legacy (4): region, town, city, street — first two locality segments merged into city
 */
export function parseEthiopiaAddressLine(s: string): {
  region: string;
  city: string;
  woreda: string;
  kebele: string;
  street: string;
} {
  const parts = s.split(",").map((x) => x.trim()).filter(Boolean);
  if (parts.length === 0) {
    return { region: "", city: "", woreda: "", kebele: "", street: "" };
  }
  if (parts.length >= 6) {
    const cityMerged = [parts[1], parts[2]].filter(Boolean).join(", ");
    return {
      region: parts[0] ?? "",
      city: cityMerged,
      woreda: parts[3] ?? "",
      kebele: parts[4] ?? "",
      street: parts.slice(5).join(", ") ?? "",
    };
  }
  if (parts.length === 5) {
    return {
      region: parts[0] ?? "",
      city: parts[1] ?? "",
      woreda: parts[2] ?? "",
      kebele: parts[3] ?? "",
      street: parts[4] ?? "",
    };
  }
  if (parts.length === 4) {
    return {
      region: parts[0] ?? "",
      city: [parts[1], parts[2]].filter(Boolean).join(", "),
      woreda: "",
      kebele: "",
      street: parts[3] ?? "",
    };
  }
  if (parts.length === 3) {
    return {
      region: parts[0] ?? "",
      city: parts[1] ?? "",
      woreda: "",
      kebele: "",
      street: parts[2] ?? "",
    };
  }
  if (parts.length === 2) {
    return { region: parts[0] ?? "", city: parts[1] ?? "", woreda: "", kebele: "", street: "" };
  }
  return { region: parts[0] ?? "", city: "", woreda: "", kebele: "", street: "" };
}

type Props = {
  value: string;
  onChange: (text: string) => void;
  label: string;
  required?: boolean;
  helperText?: string;
  variant?: "daisy" | "zinc" | "supplier";
  inputId?: string;
  /** When user picks a search result or clears, report map coordinates (WGS84). */
  onCoordinatesChange?: (lat: number | null, lng: number | null) => void;
  /** Hydrate fields on mount — pair with `key` when switching companies in an editor. */
  initialAddress?: string;
};

function inputClasses(
  variant: "daisy" | "zinc" | "supplier",
  opts?: { search?: boolean },
): string {
  if (variant === "supplier") {
    return clsx(
      "w-full rounded-xl border border-base-300 bg-base-100 py-2.5 text-sm text-base-content shadow-sm outline-none transition placeholder:text-base-content/40 focus:border-primary focus:ring-2 focus:ring-primary/20",
      opts?.search ? "pl-10 pr-3.5" : "mt-1 px-3.5",
    );
  }
  if (variant === "daisy") {
    return "input input-bordered w-full rounded-lg border-base-300 bg-base-100 text-base-content placeholder:text-base-content/40";
  }
  return "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500";
}

function labelClasses(variant: "daisy" | "zinc" | "supplier"): string {
  if (variant === "supplier") {
    return "text-xs font-semibold uppercase tracking-wide text-base-content/50";
  }
  if (variant === "daisy") {
    return "label-text font-medium text-base-content";
  }
  return "text-sm font-medium text-zinc-700 dark:text-zinc-300";
}

function composeLine(parts: {
  region: string;
  city: string;
  woreda: string;
  kebele: string;
  street: string;
}): string {
  return [parts.region, parts.city, parts.woreda, parts.kebele, parts.street]
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
  onCoordinatesChange,
  initialAddress,
}: Props) {
  const genId = useId();
  const searchId = inputIdProp ?? `${genId}-eth-search`;

  const seed = parseEthiopiaAddressLine(initialAddress ?? "");
  const [region, setRegion] = useState(seed.region);
  const [city, setCity] = useState(seed.city);
  const [woreda, setWoreda] = useState(seed.woreda);
  const [kebele, setKebele] = useState(seed.kebele);
  const [street, setStreet] = useState(seed.street);

  const [searchQ, setSearchQ] = useState("");

  const onCoordsRef = useRef(onCoordinatesChange);
  onCoordsRef.current = onCoordinatesChange;

  useEffect(() => {
    if (!value.trim()) {
      setRegion("");
      setCity("");
      setWoreda("");
      setKebele("");
      setStreet("");
      setSearchQ("");
      onCoordsRef.current?.(null, null);
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
    () => composeLine({ region, city, woreda, kebele, street }),
    [region, city, woreda, kebele, street],
  );

  useEffect(() => {
    onChange(composed);
  }, [composed, onChange]);

  const applyHit = useCallback((hit: EthiopiaSearchHit) => {
    const p = nominatimToParts(hit.address);
    setRegion(p.region);
    setCity(p.city);
    setWoreda(p.woreda);
    setKebele(p.kebele);
    setStreet(p.street);
    setSearchQ(hit.displayName);
    setOpen(false);
    setHits([]);
    setErr(null);
    const lat = Number(hit.lat);
    const lng = Number(hit.lon);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      onCoordsRef.current?.(lat, lng);
    }
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
    setCity("");
    setWoreda("");
    setKebele("");
    setStreet("");
    setSearchQ("");
    setHits([]);
    setOpen(false);
    setErr(null);
    onCoordsRef.current?.(null, null);
  }, []);

  const hintFoot =
    v === "supplier"
      ? "text-[11px] leading-relaxed text-base-content/55"
      : v === "daisy"
        ? "text-[11px] leading-snug text-base-content/50"
        : "text-[11px] leading-snug text-zinc-500 dark:text-zinc-400";

  const wrapClass =
    v === "supplier"
      ? "flex w-full flex-col gap-4 rounded-2xl border border-primary/15 bg-gradient-to-br from-base-100 via-base-100 to-primary/[0.05] p-4 shadow-sm ring-1 ring-base-300/40 sm:p-5"
      : "form-control w-full gap-2";

  return (
    <div ref={rootRef} className={wrapClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 gap-3">
          {v === "supplier" ? (
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <HiOutlineMapPin className="h-5 w-5" />
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            <label
              className={
                v === "supplier"
                  ? "block"
                  : "label min-h-0 flex-1 py-0"
              }
              htmlFor={searchId}
            >
              <span className={labelClasses(v)}>{label}</span>
            </label>
            {helperText ? (
              <p
                className={
                  v === "supplier"
                    ? "mt-1 text-[12px] leading-relaxed text-base-content/65"
                    : v === "daisy"
                      ? "text-xs text-base-content/60"
                      : "text-xs text-zinc-500 dark:text-zinc-400"
                }
              >
                {helperText}
              </p>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={clearAll}
          className={
            v === "daisy"
              ? "btn btn-ghost btn-sm shrink-0 text-base-content/70"
              : v === "supplier"
                ? "shrink-0 rounded-xl border border-base-300 bg-base-100 px-3 py-2 text-xs font-semibold text-base-content/75 shadow-sm transition hover:border-base-content/20 hover:bg-base-200"
                : "shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
          }
        >
          Clear
        </button>
      </div>

      <div className={v === "supplier" ? "space-y-2" : ""}>
        {v === "supplier" ? (
          <p className="text-[11px] font-semibold uppercase tracking-wider text-base-content/45">
            Search
          </p>
        ) : null}
        <div className={v === "supplier" ? "relative mt-1" : "relative"}>
          {v === "supplier" ? (
            <HiOutlineMagnifyingGlass
              className="pointer-events-none absolute left-3 top-1/2 z-[1] h-5 w-5 -translate-y-1/2 text-base-content/35"
              aria-hidden
            />
          ) : null}
          <input
            id={searchId}
            type="search"
            role="combobox"
            autoComplete="off"
            value={searchQ}
            onChange={(e) => {
              setSearchQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            className={inputClasses(v, v === "supplier" ? { search: true } : undefined)}
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
                  : v === "supplier"
                    ? "absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-primary"
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
                  : v === "supplier"
                    ? "absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-base-300 bg-base-100 py-1 shadow-xl shadow-base-content/[0.07] ring-1 ring-base-300/50"
                    : "absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-950"
              }
            >
              {hits.map((h, i) => (
                <li key={`${h.lat}-${h.lon}-${i}`} role="option" aria-selected={false}>
                  <button
                    type="button"
                    className={
                      v === "daisy"
                        ? "w-full px-3 py-2 text-left text-sm text-base-content hover:bg-base-200"
                        : v === "supplier"
                          ? "w-full px-3.5 py-2.5 text-left text-sm leading-snug text-base-content transition hover:bg-primary/10 active:bg-primary/15"
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
      </div>

      {err ? (
        <p className="text-xs text-error">{err}</p>
      ) : null}

      {v === "supplier" ? (
        <div className="border-t border-base-300/60 pt-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-base-content/45">
            Address details
          </p>
        </div>
      ) : null}

      <div
        className={
          v === "supplier"
            ? "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-4"
            : "grid gap-3 sm:grid-cols-2"
        }
      >
        <div className={v === "supplier" ? "flex flex-col gap-1" : "form-control gap-1"}>
          <label
            className={v === "supplier" ? undefined : "label py-0"}
            htmlFor={`${searchId}-region`}
          >
            <span className={labelClasses(v)}>Region / state</span>
          </label>
          <input
            id={`${searchId}-region`}
            type="text"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className={inputClasses(v)}
            placeholder="e.g. Oromia, Addis Ababa"
          />
        </div>
        <div className={v === "supplier" ? "flex flex-col gap-1" : "form-control gap-1"}>
          <label
            className={v === "supplier" ? undefined : "label py-0"}
            htmlFor={`${searchId}-city`}
          >
            <span className={labelClasses(v)}>City</span>
          </label>
          <input
            id={`${searchId}-city`}
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={inputClasses(v)}
            placeholder="e.g. Adama, Hawassa"
          />
        </div>
        <div className={v === "supplier" ? "flex flex-col gap-1" : "form-control gap-1"}>
          <label
            className={v === "supplier" ? undefined : "label py-0"}
            htmlFor={`${searchId}-woreda`}
          >
            <span className={labelClasses(v)}>Woreda</span>
          </label>
          <input
            id={`${searchId}-woreda`}
            type="text"
            value={woreda}
            onChange={(e) => setWoreda(e.target.value)}
            className={inputClasses(v)}
            placeholder="District (optional)"
          />
        </div>
        <div className={v === "supplier" ? "flex flex-col gap-1" : "form-control gap-1"}>
          <label
            className={v === "supplier" ? undefined : "label py-0"}
            htmlFor={`${searchId}-kebele`}
          >
            <span className={labelClasses(v)}>Kebele</span>
          </label>
          <input
            id={`${searchId}-kebele`}
            type="text"
            value={kebele}
            onChange={(e) => setKebele(e.target.value)}
            className={inputClasses(v)}
            placeholder="Neighborhood (optional)"
          />
        </div>
        <div
          className={
            v === "supplier"
              ? "flex flex-col gap-1 sm:col-span-2 xl:col-span-4"
              : "form-control gap-1 sm:col-span-2"
          }
        >
          <label
            className={v === "supplier" ? undefined : "label py-0"}
            htmlFor={`${searchId}-street`}
          >
            <span className={labelClasses(v)}>Street, building &amp; details</span>
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
        Search picks a place in Ethiopia and fills these fields — edit anything. Saved order:
        region, city, woreda, kebele, then street.
      </p>
    </div>
  );
}
