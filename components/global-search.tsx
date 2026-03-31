"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type RefObject,
} from "react";
import clsx from "clsx";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  Layers,
  Loader2,
  Package,
  Search,
  SlidersHorizontal,
  Tags,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { SearchScope } from "@/lib/search/catalog-search";
import type { AuthMeUser } from "@/lib/domain/types";
import { brandCopy } from "@/lib/brand/copy";
import {
  MERCHANT_COMMISSION_HOLD_INLINE,
  SUPPLIER_COMMISSION_HOLD_INLINE,
} from "@/lib/domain/commission-hold-copy";
import { ImagePreviewLightbox } from "@/components/image-preview-lightbox";
import { ProductUnitPrice } from "@/components/product-unit-price";
import { ProductOrderSpecs } from "@/components/product-order-specs";

const RECENT_KEY = "lm-search-recent";
const MAX_RECENT = 8;
const DROPDOWN_LIMIT = 10;

type HitProduct = {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  minOrderQuantity: number;
  maxDeliveryQuantity?: number;
  deliveryTime: string;
  availableQuantity: number;
  itemsPerCarton?: number;
  itemsPerRim?: number;
  itemsPerDozen?: number;
  companyName: string;
  categoryId: string;
  isFeatured?: boolean;
  imageUrl?: string;
};

type HitCompany = {
  id: string;
  name: string;
  isVerified: boolean;
  ratingAverage: number;
  totalReviews?: number;
  logo?: string;
};

type HitCategory = {
  id: string;
  name: string;
};

type CatalogCategory = { id: string; name: string };

const SCOPE_DEFS: {
  id: SearchScope;
  label: string;
  description: string;
  Icon: LucideIcon;
}[] = [
  {
    id: "all",
    label: "Everything",
    description: "Products, companies & categories",
    Icon: Layers,
  },
  {
    id: "products",
    label: "Products",
    description: "SKUs, tags & descriptions",
    Icon: Package,
  },
  {
    id: "companies",
    label: "Companies",
    description: "Supplier names & bios",
    Icon: Building2,
  },
  {
    id: "categories",
    label: "Categories",
    description: "Taxonomy matches",
    Icon: Tags,
  },
];

type FilterTab = "scope" | "catalog";

function SearchFiltersMenu({
  scope,
  setScope,
  narrowCategoryId,
  setNarrowCategoryId,
  catalogCategories,
  size,
  variant,
  layout = "default",
  menuContainerRef,
  onFiltersPointerDown,
}: {
  scope: SearchScope;
  setScope: (s: SearchScope) => void;
  narrowCategoryId: string;
  setNarrowCategoryId: (id: string) => void;
  catalogCategories: CatalogCategory[];
  size: "sm" | "md";
  variant: "navbar" | "hero";
  /** Tighter inline filter control for header mobile bar */
  layout?: "default" | "mobileBar";
  menuContainerRef: RefObject<HTMLDivElement | null>;
  onFiltersPointerDown?: () => void;
}) {
  const catInputRef = useRef<HTMLInputElement>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [tab, setTab] = useState<FilterTab>("scope");
  const [catQ, setCatQ] = useState("");

  const scopeMeta = SCOPE_DEFS.find((s) => s.id === scope) ?? SCOPE_DEFS[0];
  const narrowLabel =
    narrowCategoryId === ""
      ? "Any category"
      : catalogCategories.find((c) => c.id === narrowCategoryId)?.name ??
        "Category";

  const catalogReady = catalogCategories.length > 0;

  const filteredCats = useMemo(() => {
    const s = catQ.trim().toLowerCase();
    if (!s) return catalogCategories;
    return catalogCategories.filter((c) => c.name.toLowerCase().includes(s));
  }, [catalogCategories, catQ]);

  const close = useCallback(() => {
    setFiltersOpen(false);
    setCatQ("");
  }, []);

  useEffect(() => {
    if (!filtersOpen) return;
    if (tab === "catalog") catInputRef.current?.focus();
  }, [filtersOpen, tab]);

  useEffect(() => {
    if (!filtersOpen) return;

    let cancelled = false;
    let removePointer: (() => void) | null = null;
    let removeKey: (() => void) | null = null;

    const frame = requestAnimationFrame(() => {
      if (cancelled) return;
      function onPointerDown(e: PointerEvent) {
        const root = menuContainerRef.current;
        if (!root || root.contains(e.target as Node)) return;
        close();
      }
      function onKey(e: KeyboardEvent) {
        if (e.key === "Escape") close();
      }
      document.addEventListener("pointerdown", onPointerDown, true);
      document.addEventListener("keydown", onKey);
      removePointer = () =>
        document.removeEventListener("pointerdown", onPointerDown, true);
      removeKey = () => document.removeEventListener("keydown", onKey);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      removePointer?.();
      removeKey?.();
    };
  }, [filtersOpen, close, menuContainerRef]);

  const compact = size === "sm";
  const isHero = variant === "hero";
  const isMobileBar = layout === "mobileBar";

  return (
    <div
      ref={menuContainerRef}
      className={clsx(
        "relative h-full min-w-0",
        isMobileBar ? "w-full max-w-[11rem]" : "w-full sm:w-auto",
      )}
    >
      <button
        type="button"
        aria-expanded={filtersOpen}
        aria-haspopup="dialog"
        aria-label={`Search filters: ${scopeMeta.label}, ${narrowLabel}`}
        onMouseDown={() => {
          onFiltersPointerDown?.();
        }}
        onClick={() => setFiltersOpen((o) => !o)}
        className={clsx(
          "flex w-full items-center justify-between gap-1.5 text-left font-medium text-base-content transition",
          "border-0 bg-transparent hover:bg-base-200/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/20",
          isMobileBar
            ? "h-full min-h-[2.75rem] rounded-none rounded-l-xl px-2 py-2"
            : [
                "rounded-t-lg sm:rounded-l-lg sm:rounded-tr-none",
                compact ? "min-h-9 px-2 sm:px-2.5" : "min-h-11 px-2.5 sm:px-3",
              ],
        )}
      >
        <span className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
          <span
            className={clsx(
              "flex shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary",
              isMobileBar
                ? "h-7 w-7"
                : compact
                  ? "h-6 w-6"
                  : "h-8 w-8",
            )}
          >
            <SlidersHorizontal
              className={
                isMobileBar ? "h-4 w-4" : compact ? "h-3.5 w-3.5" : "h-4 w-4"
              }
              strokeWidth={2.25}
              aria-hidden
            />
          </span>
          <span className="min-w-0 flex-1">
            <span
              className={clsx(
                "block truncate font-semibold leading-tight text-base-content",
                isMobileBar
                  ? "text-[11px] leading-snug"
                  : compact
                    ? "text-[11px] sm:text-xs"
                    : "text-xs sm:text-sm",
              )}
            >
              {scopeMeta.label}
            </span>
            <span
              className={clsx(
                "mt-px block truncate font-normal leading-tight text-base-content/45",
                isMobileBar
                  ? "text-[9px]"
                  : "text-[10px] sm:text-[11px]",
              )}
            >
              {narrowLabel}
            </span>
          </span>
        </span>
        <ChevronDown
          className={clsx(
            "shrink-0 opacity-50 transition-transform duration-200",
            isMobileBar ? "h-3.5 w-3.5" : compact ? "h-3.5 w-3.5" : "h-4 w-4",
            filtersOpen && "rotate-180",
          )}
          strokeWidth={2.25}
          aria-hidden
        />
      </button>

      {filtersOpen && (
        <div
          role="dialog"
          aria-label="Search filters"
          className={clsx(
            "card absolute left-0 right-0 top-[calc(100%+6px)] z-[140] flex max-h-[min(70vh,20rem)] flex-col overflow-hidden rounded-xl border border-base-300/90 bg-base-100 p-0 text-sm shadow-xl ring-1 ring-base-content/5 sm:left-0 sm:right-auto sm:w-[min(100vw-2rem,18rem)]",
            isHero && "shadow-2xl ring-base-content/8",
          )}
        >
          <div className="flex gap-0.5 border-b border-base-300/70 bg-base-200/35 p-1">
            <button
              type="button"
              className={clsx(
                "flex-1 rounded-md px-2 py-1.5 text-center text-[11px] font-semibold transition sm:text-xs",
                tab === "scope"
                  ? "bg-base-100 text-primary shadow-sm"
                  : "text-base-content/55 hover:bg-base-100/70 hover:text-base-content",
              )}
              onClick={() => setTab("scope")}
            >
              Search in
            </button>
            <button
              type="button"
              disabled={!catalogReady}
              className={clsx(
                "flex-1 rounded-md px-2 py-1.5 text-center text-[11px] font-semibold transition sm:text-xs",
                !catalogReady && "cursor-not-allowed opacity-45",
                tab === "catalog"
                  ? "bg-base-100 text-primary shadow-sm"
                  : "text-base-content/55 hover:bg-base-100/70 hover:text-base-content",
              )}
              onClick={() => catalogReady && setTab("catalog")}
            >
              Catalog
            </button>
          </div>

          {tab === "scope" && (
            <ul
              className="max-h-[min(52vh,14rem)] overflow-y-auto overscroll-contain py-1"
              role="listbox"
              aria-label="Search scope"
            >
              {SCOPE_DEFS.map((s) => {
                const active = scope === s.id;
                const Icon = s.Icon;
                return (
                  <li key={s.id} role="option" aria-selected={active}>
                    <button
                      type="button"
                      className={clsx(
                        "mx-1 flex w-[calc(100%-8px)] items-start gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition sm:text-[13px]",
                        active
                          ? "bg-primary/12 font-semibold text-primary"
                          : "hover:bg-base-200/80",
                      )}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setScope(s.id);
                        close();
                      }}
                    >
                      <Icon
                        className="mt-0.5 h-4 w-4 shrink-0 opacity-85"
                        strokeWidth={2.25}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block leading-snug">{s.label}</span>
                        <span className="mt-0.5 block text-xs font-normal text-base-content/50">
                          {s.description}
                        </span>
                      </span>
                      {active ? (
                        <Check className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {tab === "catalog" && catalogReady && (
            <>
              <div className="border-b border-base-300/60 bg-base-200/25 px-2.5 py-2">
                <label className="relative block">
                  <Search
                    className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-base-content/40"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                  <input
                    ref={catInputRef}
                    type="search"
                    value={catQ}
                    onChange={(e) => setCatQ(e.target.value)}
                    placeholder="Filter categories…"
                    className="input input-xs h-8 w-full rounded-lg border-base-300/80 bg-base-100 pl-8 text-xs placeholder:text-base-content/40 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/25"
                  />
                </label>
              </div>
              <ul
                className="max-h-[min(48vh,12rem)] overflow-y-auto overscroll-contain py-1"
                role="listbox"
                aria-label="Catalog category"
              >
                <li role="option" aria-selected={narrowCategoryId === ""}>
                  <button
                    type="button"
                    className={clsx(
                      "mx-1 flex w-[calc(100%-8px)] items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition sm:text-[13px]",
                      narrowCategoryId === ""
                        ? "bg-primary/12 font-semibold text-primary"
                        : "hover:bg-base-200/80",
                    )}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setNarrowCategoryId("");
                      close();
                    }}
                  >
                    Any category
                    {narrowCategoryId === "" ? (
                      <Check className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                    ) : null}
                  </button>
                </li>
                {filteredCats.map((c) => {
                  const active = narrowCategoryId === c.id;
                  return (
                    <li key={c.id} role="option" aria-selected={active}>
                      <button
                        type="button"
                        className={clsx(
                          "mx-1 flex w-[calc(100%-8px)] items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition sm:text-[13px]",
                          active
                            ? "bg-primary/12 font-semibold text-primary"
                            : "hover:bg-base-200/80",
                        )}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setNarrowCategoryId(c.id);
                          close();
                        }}
                      >
                        <span className="truncate">{c.name}</span>
                        {active ? (
                          <Check className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {filteredCats.length === 0 && (
                <p className="px-4 py-5 text-center text-sm text-base-content/50">
                  No categories match “{catQ.trim()}”.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const a = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(a) ? a.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function pushRecent(term: string) {
  const t = term.trim();
  if (!t) return;
  const prev = readRecent().filter((x) => x.toLowerCase() !== t.toLowerCase());
  prev.unshift(t);
  localStorage.setItem(RECENT_KEY, JSON.stringify(prev.slice(0, MAX_RECENT)));
}

export type GlobalSearchProps = {
  variant?: "navbar" | "hero";
  /**
   * Inline filter + search on one row, tuned for the header mobile strip (`md:hidden`).
   */
  layout?: "default" | "mobileBar";
  className?: string;
  /** SSR hint; live value merged from GET /api/auth/me when logged in */
  merchantCommissionHold?: boolean;
  /** SSR hint; live value merged from GET /api/auth/me when logged in */
  supplierCommissionHold?: boolean;
};

export function GlobalSearch({
  variant = "navbar",
  layout = "default",
  className = "",
  merchantCommissionHold = false,
  supplierCommissionHold = false,
}: GlobalSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const panelId = useId();
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const panelBlurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [q, setQ] = useState("");
  const [scope, setScope] = useState<SearchScope>("all");
  const [narrowCategoryId, setNarrowCategoryId] = useState("");
  const [catalogCategories, setCatalogCategories] = useState<CatalogCategory[]>(
    [],
  );
  const [panelOpen, setPanelOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<HitProduct[]>([]);
  const [companies, setCompanies] = useState<HitCompany[]>([]);
  const [categories, setCategories] = useState<HitCategory[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  /** After /api/auth/me — overrides SSR props when set */
  const [apiMerchantHold, setApiMerchantHold] = useState<boolean | null>(null);
  const [apiSupplierHold, setApiSupplierHold] = useState<boolean | null>(null);
  /** Full-screen preview for product / company images in results */
  const [imagePreview, setImagePreview] = useState<{
    src: string;
    alt: string;
  } | null>(null);

  const fetchAuthMeHolds = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });
      if (res.status === 401) {
        setApiMerchantHold(null);
        setApiSupplierHold(null);
        return;
      }
      if (!res.ok) return;
      const data = (await res.json()) as {
        user?: Pick<
          AuthMeUser,
          "merchantCommissionHold" | "supplierCommissionHold"
        >;
      };
      const u = data.user;
      if (!u) return;
      setApiMerchantHold(
        typeof u.merchantCommissionHold === "boolean"
          ? u.merchantCommissionHold
          : null,
      );
      setApiSupplierHold(
        typeof u.supplierCommissionHold === "boolean"
          ? u.supplierCommissionHold
          : null,
      );
    } catch {
      /* keep prior api* state */
    }
  }, []);

  useEffect(() => {
    void fetchAuthMeHolds();
  }, [fetchAuthMeHolds, pathname]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") void fetchAuthMeHolds();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [fetchAuthMeHolds]);

  const effectiveMerchantHold =
    apiMerchantHold !== null ? apiMerchantHold : merchantCommissionHold;
  const effectiveSupplierHold =
    apiSupplierHold !== null ? apiSupplierHold : supplierCommissionHold;

  const isHero = variant === "hero";
  const isMobileBar = layout === "mobileBar";
  const ddSize = isHero ? "md" : "sm";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        const list = data.categories as CatalogCategory[] | undefined;
        if (!cancelled && Array.isArray(list)) setCatalogCategories(list);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const run = useCallback(
    async (term: string, sc: SearchScope) => {
      if (!term.trim()) {
        setProducts([]);
        setCompanies([]);
        setCategories([]);
        setSearchError(null);
        return;
      }
      setLoading(true);
      setSearchError(null);
      try {
        const catQ =
          narrowCategoryId !== ""
            ? `&category=${encodeURIComponent(narrowCategoryId)}`
            : "";
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(term.trim())}&scope=${sc}&limit=${DROPDOWN_LIMIT}${catQ}`,
          { credentials: "same-origin" },
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setProducts([]);
          setCompanies([]);
          setCategories([]);
          setSearchError(
            typeof data.error === "string"
              ? data.error
              : "Search is temporarily unavailable. Try again shortly.",
          );
          return;
        }
        setProducts(data.products ?? []);
        setCompanies(data.companies ?? []);
        setCategories(data.categories ?? []);
      } catch {
        setProducts([]);
        setCompanies([]);
        setCategories([]);
        setSearchError("Could not reach search. Check your connection.");
      } finally {
        setLoading(false);
      }
    },
    [narrowCategoryId],
  );

  useEffect(() => {
    setRecent(readRecent());
  }, [panelOpen]);

  const clearPanelBlurTimeout = useCallback(() => {
    if (panelBlurTimeoutRef.current !== null) {
      clearTimeout(panelBlurTimeoutRef.current);
      panelBlurTimeoutRef.current = null;
    }
  }, []);

  const onFiltersPointerDown = useCallback(() => {
    clearPanelBlurTimeout();
    setPanelOpen(false);
  }, [clearPanelBlurTimeout]);

  useEffect(() => {
    const t = setTimeout(() => run(q, scope), 220);
    return () => clearTimeout(t);
  }, [q, scope, run]);

  const scopeMeta = SCOPE_DEFS.find((s) => s.id === scope) ?? SCOPE_DEFS[0];
  const narrowLabel =
    narrowCategoryId === ""
      ? "Any category"
      : catalogCategories.find((c) => c.id === narrowCategoryId)?.name ??
        "Category";

  function goFullSearch(term?: string) {
    const query = (term ?? q).trim();
    if (query) pushRecent(query);
    setPanelOpen(false);
    const cat = narrowCategoryId
      ? `&category=${encodeURIComponent(narrowCategoryId)}`
      : "";
    router.push(
      `/search?q=${encodeURIComponent(query)}&scope=${scope}${cat}`,
    );
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    goFullSearch();
  }

  const hasQuery = q.trim().length > 0;
  const hasHits =
    products.length > 0 || companies.length > 0 || categories.length > 0;
  const showPanel = panelOpen;

  const popular = brandCopy.search.popularKeywords;

  const barRounded = isHero ? "rounded-xl sm:rounded-2xl" : "rounded-lg";
  const searchBarRounded = isMobileBar ? "rounded-xl" : barRounded;

  return (
    <div className={`relative w-full ${className}`}>
      {effectiveMerchantHold ? (
        <div className="mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-amber-500/35 bg-amber-500/10 px-2.5 py-2 text-[11px] leading-snug text-base-content sm:text-xs">
          <AlertTriangle
            className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400"
            aria-hidden
          />
          <span className="min-w-0 flex-1">{MERCHANT_COMMISSION_HOLD_INLINE}</span>
          <Link
            href="/merchant/orders?hold=commission"
            className="shrink-0 font-semibold text-amber-800 underline-offset-2 hover:underline dark:text-amber-200"
            onMouseDown={() => setPanelOpen(false)}
          >
            Open orders
          </Link>
        </div>
      ) : null}
      {effectiveSupplierHold ? (
        <div className="mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-violet-500/35 bg-violet-500/10 px-2.5 py-2 text-[11px] leading-snug text-base-content sm:text-xs">
          <AlertTriangle
            className="h-3.5 w-3.5 shrink-0 text-violet-600 dark:text-violet-400"
            aria-hidden
          />
          <span className="min-w-0 flex-1">{SUPPLIER_COMMISSION_HOLD_INLINE}</span>
          <Link
            href="/supplier/orders?hold=commission"
            className="shrink-0 font-semibold text-violet-800 underline-offset-2 hover:underline dark:text-violet-200"
            onMouseDown={() => setPanelOpen(false)}
          >
            Open orders
          </Link>
        </div>
      ) : null}
      <form onSubmit={onSubmit} className="relative">
        <div
          className={clsx(
            /* overflow-visible so the filter popover (absolute) is not clipped */
            "card flex overflow-visible border border-base-300/75 bg-base-100/95 p-0 shadow-sm transition-[box-shadow,border-color,ring]",
            "focus-within:border-primary/30 focus-within:shadow-md focus-within:ring-1 focus-within:ring-primary/15",
            isMobileBar
              ? "flex-row items-stretch"
              : "flex-col sm:flex-row sm:items-stretch",
            searchBarRounded,
            isHero && "shadow-md",
          )}
        >
          <div
            className={clsx(
              "flex shrink-0 border-base-300/70",
              isMobileBar
                ? "h-full min-h-[2.75rem] max-w-[min(44%,11rem)] border-b-0 border-r sm:max-w-[12.5rem]"
                : "border-b sm:max-w-[min(100%,12.5rem)] sm:border-b-0 sm:border-r sm:pl-0.5 md:max-w-[13.5rem]",
            )}
          >
            <SearchFiltersMenu
              scope={scope}
              setScope={setScope}
              narrowCategoryId={narrowCategoryId}
              setNarrowCategoryId={setNarrowCategoryId}
              catalogCategories={catalogCategories}
              size={ddSize}
              variant={variant}
              layout={layout}
              menuContainerRef={filterMenuRef}
              onFiltersPointerDown={onFiltersPointerDown}
            />
          </div>

          <label
            className={clsx(
              "flex flex-1 cursor-text items-center gap-2 bg-base-100/80 px-2.5",
              isMobileBar &&
                "min-h-[2.75rem] rounded-r-xl py-2 pl-2 pr-2.5 sm:px-3",
              !isMobileBar &&
                (isHero
                  ? "min-h-11 py-2.5 sm:min-h-12 sm:px-3.5"
                  : "min-h-9 py-1.5 sm:min-h-9 sm:py-2 sm:pr-3"),
            )}
          >
            <Search
              className={clsx(
                "shrink-0 text-base-content/40",
                isHero ? "h-5 w-5 sm:h-5 sm:w-5" : "h-4 w-4",
              )}
              strokeWidth={2.25}
              aria-hidden
            />
            <input
              id={panelId}
              type="search"
              role="combobox"
              aria-expanded={panelOpen}
              aria-controls={`${panelId}-panel`}
              aria-autocomplete="list"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPanelOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  clearPanelBlurTimeout();
                  setPanelOpen(false);
                  (e.target as HTMLInputElement).blur();
                }
              }}
              onFocus={() => {
                clearPanelBlurTimeout();
                setPanelOpen(true);
              }}
              onBlur={(e) => {
                const next = e.relatedTarget;
                if (
                  next instanceof Node &&
                  filterMenuRef.current?.contains(next)
                ) {
                  return;
                }
                clearPanelBlurTimeout();
                panelBlurTimeoutRef.current = setTimeout(() => {
                  setPanelOpen(false);
                  panelBlurTimeoutRef.current = null;
                }, 180);
              }}
              placeholder={brandCopy.search.placeholder}
              className={clsx(
                "min-w-0 flex-1 border-0 bg-transparent text-base-content outline-none placeholder:text-base-content/38",
                isHero ? "text-base leading-snug" : "text-sm leading-snug",
              )}
            />
            {loading && (
              <Loader2
                className={clsx(
                  "shrink-0 animate-spin text-primary",
                  isHero ? "h-4 w-4" : "h-3.5 w-3.5",
                )}
                aria-hidden
              />
            )}
          </label>
        </div>

        {showPanel && (
          <div
            id={`${panelId}-panel`}
            role="listbox"
            className={clsx(
              "card absolute left-0 right-0 top-full z-[120] mt-1.5 max-h-[min(70vh,480px)] overflow-hidden rounded-xl border border-base-300/85 bg-base-100 p-0 shadow-lg ring-1 ring-base-content/5",
              isHero && "shadow-2xl ring-base-content/8",
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-base-200/90 bg-base-200/40 px-2.5 py-2">
              <p className="text-[11px] font-medium text-base-content/55 sm:text-xs">
                <span className="font-semibold text-base-content/75">
                  {scopeMeta.label}
                </span>
                <span className="text-base-content/35"> · </span>
                <span
                  className={
                    narrowCategoryId ? "font-medium text-accent" : undefined
                  }
                >
                  {narrowLabel}
                </span>
              </p>
              {narrowCategoryId ? (
                <Link
                  href={`/browse?category=${encodeURIComponent(narrowCategoryId)}`}
                  className="link link-primary text-xs font-semibold no-underline hover:underline"
                  onMouseDown={() => pushRecent(q)}
                >
                  Browse aisle →
                </Link>
              ) : (
                <Link
                  href="/browse"
                  className="link link-hover text-xs text-base-content/50"
                >
                  Full catalog
                </Link>
              )}
            </div>

            <div className="max-h-[min(52vh,380px)] overflow-y-auto overscroll-contain p-1.5 sm:p-2">
              {!hasQuery && (
                <div className="space-y-3 px-1.5 py-2 sm:px-2 sm:py-2.5">
                  <div>
                    <p className="text-[0.6rem] font-bold uppercase tracking-wider text-base-content/40">
                      Recent searches
                    </p>
                    {recent.length === 0 ? (
                      <p className="mt-1 text-xs text-base-content/50">
                        Your recent queries will appear here.
                      </p>
                    ) : (
                      <ul className="mt-1.5 flex flex-col gap-1 sm:flex-row sm:flex-wrap">
                        {recent.map((r) => (
                          <li key={r}>
                            <button
                              type="button"
                              className="w-full rounded-lg border border-base-300/70 bg-base-200/30 px-2.5 py-1.5 text-left text-xs font-medium transition hover:border-primary/30 hover:bg-base-200/65 sm:w-auto sm:text-[13px]"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setQ(r);
                                setPanelOpen(true);
                              }}
                            >
                              {r}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <p className="text-[0.6rem] font-bold uppercase tracking-wider text-base-content/40">
                      Popular keywords
                    </p>
                    <ul className="mt-1.5 flex flex-col gap-1 sm:flex-row sm:flex-wrap">
                      {popular.map((kw) => (
                        <li key={kw}>
                          <button
                            type="button"
                            className="w-full rounded-lg bg-primary/10 px-2.5 py-1.5 text-left text-xs font-medium text-primary transition hover:bg-primary/16 sm:w-auto sm:text-[13px]"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setQ(kw);
                              setPanelOpen(true);
                            }}
                          >
                            {kw}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-[11px] leading-relaxed text-base-content/48 sm:text-xs">
                    {brandCopy.search.hint}
                  </p>
                </div>
              )}

              {hasQuery && searchError && !loading && (
                <p className="mx-1.5 mt-1.5 rounded-lg border border-error/30 bg-error/10 px-2.5 py-2 text-center text-xs text-error sm:text-sm">
                  {searchError}
                </p>
              )}

              {hasQuery && !hasHits && !loading && !searchError && (
                <p className="px-3 py-6 text-center text-xs text-base-content/55 sm:text-sm">
                  No instant matches with these filters. Press{" "}
                  <kbd className="kbd kbd-sm">Enter</kbd> for full results or
                  widen search scope.
                </p>
              )}

              {hasQuery &&
                companies.length > 0 &&
                (scope === "all" || scope === "companies") && (
                  <div className="mb-3">
                    <p className="flex items-center gap-2 px-2 py-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-secondary">
                      <Building2 className="h-4 w-4" strokeWidth={2.25} />
                      Companies
                    </p>
                    <ul className="space-y-0.5">
                      {companies.map((c) => (
                        <li key={c.id}>
                          <Link
                            href={`/companies/${c.id}`}
                            className="flex flex-col gap-1 rounded-lg px-2.5 py-2 text-left text-[13px] transition hover:bg-base-200 sm:flex-row sm:items-center sm:justify-between"
                            onMouseDown={() => pushRecent(q)}
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              {c.logo ? (
                                <button
                                  type="button"
                                  className="relative h-12 w-12 shrink-0 cursor-zoom-in overflow-hidden rounded-xl border-2 border-base-200 bg-base-200/80 shadow-sm ring-1 ring-base-300/40 transition hover:border-primary/35 hover:ring-primary/20"
                                  aria-label={`View larger: ${c.name} logo`}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setImagePreview({
                                      src: c.logo!,
                                      alt: `${c.name} logo`,
                                    });
                                  }}
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={c.logo}
                                    alt=""
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                  />
                                </button>
                              ) : null}
                              <span className="truncate font-medium">
                                {c.name}
                              </span>
                            </span>
                            <span className="shrink-0 text-xs text-base-content/50">
                              {c.isVerified ? "Verified" : "Pending"} ·{" "}
                              {c.ratingAverage.toFixed(1)}★
                              {typeof c.totalReviews === "number" &&
                              c.totalReviews > 0
                                ? ` · ${c.totalReviews} review${c.totalReviews === 1 ? "" : "s"}`
                                : ""}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {hasQuery &&
                products.length > 0 &&
                (scope === "all" || scope === "products") && (
                  <div className="mb-3">
                    <p className="flex items-center gap-2 px-2 py-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-primary">
                      <Package className="h-4 w-4" strokeWidth={2.25} />
                      Products
                      {narrowCategoryId ? (
                        <span className="font-normal normal-case text-base-content/45">
                          ({narrowLabel})
                        </span>
                      ) : null}
                    </p>
                    <ul
                      className={clsx(
                        "space-y-0.5",
                        isHero && "space-y-1.5",
                      )}
                    >
                      {products.map((p) => (
                        <li key={p.id}>
                          <Link
                            href={`/products/${p.id}`}
                            className={clsx(
                              "flex gap-2 text-left text-[13px] transition sm:items-center sm:justify-between",
                              isHero
                                ? "rounded-xl border border-base-200/80 bg-base-100/50 px-2.5 py-2 shadow-sm hover:border-primary/25 hover:bg-base-200/40 sm:px-3 sm:py-2.5"
                                : "flex-col gap-0.5 rounded-lg px-2.5 py-2 hover:bg-base-200 sm:flex-row",
                            )}
                            onMouseDown={() => pushRecent(q)}
                          >
                            <span className="flex min-w-0 flex-1 items-start gap-2">
                              {p.imageUrl ? (
                                <button
                                  type="button"
                                  className={clsx(
                                    "shrink-0 cursor-zoom-in overflow-hidden rounded-xl border-2 border-base-200 bg-base-200/50 shadow-sm ring-1 ring-base-300/40 transition hover:border-primary/35 hover:ring-primary/20",
                                    isHero
                                      ? "h-14 w-14 sm:h-16 sm:w-16"
                                      : "mt-0.5 h-11 w-11 sm:h-12 sm:w-12",
                                  )}
                                  aria-label={`View larger product image: ${p.name}`}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setImagePreview({
                                      src: p.imageUrl!,
                                      alt: p.name,
                                    });
                                  }}
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={p.imageUrl}
                                    alt=""
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                  />
                                </button>
                              ) : null}
                              <span className="min-w-0 flex-1">
                                <span className="flex flex-wrap items-center gap-2 font-medium">
                                  <span className="truncate">{p.name}</span>
                                  {p.isFeatured ? (
                                    <span className="badge badge-warning badge-xs shrink-0 uppercase">
                                      Featured
                                    </span>
                                  ) : null}
                                </span>
                                <span className="mt-0.5 block truncate text-xs text-base-content/50 sm:hidden">
                                  {p.companyName}
                                </span>
                              </span>
                            </span>
                            <span className="flex shrink-0 flex-col items-stretch gap-1 sm:items-end sm:text-right">
                              <span className="hidden truncate text-xs text-base-content/55 sm:block sm:max-w-[11rem]">
                                {p.companyName}
                              </span>
                              <ProductUnitPrice
                                price={p.price}
                                compareAtPrice={p.compareAtPrice}
                                suffix=" each"
                              />
                              <ProductOrderSpecs
                                className="mt-0.5"
                                align="end"
                                product={{
                                  minOrderQuantity: p.minOrderQuantity,
                                  maxDeliveryQuantity: p.maxDeliveryQuantity,
                                  deliveryTime: p.deliveryTime,
                                  availableQuantity: p.availableQuantity,
                                  itemsPerCarton: p.itemsPerCarton,
                                  itemsPerRim: p.itemsPerRim,
                                  itemsPerDozen: p.itemsPerDozen,
                                }}
                              />
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {hasQuery &&
                categories.length > 0 &&
                (scope === "all" || scope === "categories") && (
                  <div className="mb-2">
                    <p className="flex items-center gap-2 px-2 py-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-accent">
                      <Tags className="h-4 w-4" strokeWidth={2.25} />
                      Categories
                    </p>
                    <ul className="flex flex-col gap-1 px-1 pb-2 sm:flex-row sm:flex-wrap">
                      {categories.map((c) => (
                        <li key={c.id} className="sm:flex-initial">
                          <Link
                            href={`/browse?category=${c.id}`}
                            className="block w-full rounded-xl border border-accent/25 bg-accent/5 px-3 py-2 text-center text-sm font-medium text-accent transition hover:bg-accent/12 sm:inline-block sm:w-auto"
                            onMouseDown={() => pushRecent(q)}
                          >
                            {c.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>

            <div className="flex flex-col gap-1.5 border-t border-base-200/90 bg-base-200/40 px-2.5 py-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="hidden text-[11px] text-base-content/48 lg:inline">
                Filters · Enter: full search · Esc: close
              </span>
              <button
                type="button"
                className={clsx(
                  "btn btn-primary btn-sm gap-1 rounded-lg normal-case sm:ml-auto",
                  isHero && "sm:btn-md sm:rounded-xl",
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => goFullSearch()}
              >
                View all results
                <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.25} />
              </button>
            </div>
          </div>
        )}
      </form>

      {imagePreview ? (
        <ImagePreviewLightbox
          open
          onClose={() => setImagePreview(null)}
          src={imagePreview.src}
          alt={imagePreview.alt}
        />
      ) : null}
    </div>
  );
}
