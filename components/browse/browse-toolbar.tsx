import Link from "next/link";
import {
  HiChevronDown,
  HiOutlineAdjustmentsHorizontal,
} from "react-icons/hi2";
import type { Category } from "@/lib/domain/types";

const SORT_OPTIONS: { value: string; label: string; hint: string }[] = [
  { value: "recent", label: "Most recent", hint: "Newest listings first" },
  { value: "orders", label: "Most ordered", hint: "Highest order volume" },
  { value: "rating", label: "Top rated", hint: "Best average ratings" },
  { value: "price_asc", label: "Price: low → high", hint: "Cheapest unit price first" },
  { value: "price_desc", label: "Price: high → low", hint: "Premium SKUs first" },
];

export type BrowseFilterState = {
  minPrice: string;
  maxPrice: string;
  minRating: string;
  stock: string;
  /** Min max-delivery capacity (PDF: delivery capacity filter) */
  minShip: string;
  /** Exact match on Product.shipFromRegion (PDF: location filter) */
  region: string;
};

type Props = {
  sort: string;
  categoryId: string;
  categories: Category[];
  activeCategory: Category | undefined;
  /** Distinct non-empty regions in the current category (or full catalog) */
  regions: string[];
  filters: BrowseFilterState;
};

function buildBrowseHref(
  sort: string,
  categoryId: string,
  f: BrowseFilterState,
) {
  const u = new URLSearchParams();
  u.set("sort", sort);
  if (categoryId) u.set("category", categoryId);
  if (f.minPrice) u.set("minPrice", f.minPrice);
  if (f.maxPrice) u.set("maxPrice", f.maxPrice);
  if (f.minRating) u.set("minRating", f.minRating);
  if (f.stock) u.set("stock", f.stock);
  if (f.minShip) u.set("minShip", f.minShip);
  if (f.region) u.set("region", f.region);
  return `/browse?${u.toString()}`;
}

function mergeFilters(
  base: BrowseFilterState,
  patch: Partial<BrowseFilterState>,
): BrowseFilterState {
  return {
    minPrice: patch.minPrice !== undefined ? patch.minPrice : base.minPrice,
    maxPrice: patch.maxPrice !== undefined ? patch.maxPrice : base.maxPrice,
    minRating: patch.minRating !== undefined ? patch.minRating : base.minRating,
    stock: patch.stock !== undefined ? patch.stock : base.stock,
    minShip: patch.minShip !== undefined ? patch.minShip : base.minShip,
    region: patch.region !== undefined ? patch.region : base.region,
  };
}

export function BrowseToolbar({
  sort,
  categoryId,
  categories,
  activeCategory,
  regions,
  filters,
}: Props) {
  const sortLabel =
    SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Most recent";
  const categoryLabel = activeCategory?.name ?? "All categories";

  const href = (patch: Partial<BrowseFilterState>) =>
    buildBrowseHref(
      sort,
      activeCategory?.id ?? "",
      mergeFilters(filters, patch),
    );

  const priceLabel =
    filters.maxPrice === "400" && !filters.minPrice
      ? "≤ 400 ETB"
      : filters.minPrice === "400" && filters.maxPrice === "1000"
        ? "400 – 1 000 ETB"
        : filters.minPrice === "1000" && !filters.maxPrice
          ? "≥ 1 000 ETB"
          : "Any price";

  const ratingLabel =
    filters.minRating === "4"
      ? "4★+"
      : filters.minRating === "4.5"
        ? "4.5★+"
        : "Any rating";

  const stockLabel = filters.stock === "in_stock" ? "In stock" : "All stock";

  const shipLabel =
    filters.minShip === "100"
      ? "Ship ≥ 100"
      : filters.minShip === "500"
        ? "Ship ≥ 500"
        : filters.minShip === "1000"
          ? "Ship ≥ 1 000"
          : "Any capacity";

  const regionLabel = filters.region || "Any region";

  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-base-content/45">
        <HiOutlineAdjustmentsHorizontal className="h-4 w-4" />
        Filters
      </div>
      <div className="flex flex-wrap gap-3">
        <details className="group relative">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-base-300/90 bg-base-100 px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:border-primary/35 hover:shadow-md [&::-webkit-details-marker]:hidden">
            <span className="text-xs font-normal text-base-content/50">
              Sort
            </span>
            {sortLabel}
            <HiChevronDown className="h-4 w-4 shrink-0 opacity-60 transition group-open:rotate-180" />
          </summary>
          <ul className="absolute left-0 top-[calc(100%+8px)] z-30 min-w-[14rem] rounded-xl border border-base-300 bg-base-100 p-1.5 shadow-xl">
            {SORT_OPTIONS.map((o) => (
              <li key={o.value}>
                <Link
                  href={buildBrowseHref(
                    o.value,
                    activeCategory?.id ?? "",
                    filters,
                  )}
                  className={`flex flex-col rounded-lg px-3 py-2.5 text-sm transition hover:bg-base-200 ${
                    sort === o.value ? "bg-primary/10 font-semibold text-primary" : ""
                  }`}
                >
                  <span>{o.label}</span>
                  <span className="text-xs font-normal text-base-content/50">
                    {o.hint}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </details>

        {categories.length > 0 && (
          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-base-300/90 bg-base-100 px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:border-accent/40 hover:shadow-md [&::-webkit-details-marker]:hidden">
              <span className="text-xs font-normal text-base-content/50">
                Category
              </span>
              <span className="max-w-[10rem] truncate sm:max-w-[14rem]">
                {categoryLabel}
              </span>
              <HiChevronDown className="h-4 w-4 shrink-0 opacity-60 transition group-open:rotate-180" />
            </summary>
            <ul className="absolute left-0 top-[calc(100%+8px)] z-30 max-h-72 min-w-[15rem] max-w-[min(100vw-2rem,20rem)] overflow-y-auto overscroll-contain rounded-xl border border-base-300 bg-base-100 p-1.5 shadow-xl">
              <li>
                <Link
                  href={buildBrowseHref(sort, "", filters)}
                  className={`block rounded-lg px-3 py-2.5 text-sm transition hover:bg-base-200 ${
                    !activeCategory
                      ? "bg-accent/10 font-semibold text-accent"
                      : ""
                  }`}
                >
                  All categories
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={buildBrowseHref(sort, c.id, filters)}
                    className={`block rounded-lg px-3 py-2.5 text-sm transition hover:bg-base-200 ${
                      categoryId === c.id
                        ? "bg-accent/10 font-semibold text-accent"
                        : ""
                    }`}
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        )}

        <details className="group relative">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-base-300/90 bg-base-100 px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:border-secondary/35 hover:shadow-md [&::-webkit-details-marker]:hidden">
            <span className="text-xs font-normal text-base-content/50">
              Price
            </span>
            {priceLabel}
            <HiChevronDown className="h-4 w-4 shrink-0 opacity-60 transition group-open:rotate-180" />
          </summary>
          <ul className="absolute left-0 top-[calc(100%+8px)] z-30 min-w-[12rem] rounded-xl border border-base-300 bg-base-100 p-1.5 shadow-xl">
            <li>
              <Link
                href={href({
                  minPrice: "",
                  maxPrice: "",
                })}
                className={`block rounded-lg px-3 py-2.5 text-sm transition hover:bg-base-200 ${
                  !filters.minPrice && !filters.maxPrice
                    ? "bg-secondary/10 font-semibold text-secondary"
                    : ""
                }`}
              >
                Any price
              </Link>
            </li>
            <li>
              <Link
                href={href({ minPrice: "", maxPrice: "400" })}
                className={`block rounded-lg px-3 py-2.5 text-sm transition hover:bg-base-200 ${
                  filters.maxPrice === "400" && !filters.minPrice
                    ? "bg-secondary/10 font-semibold text-secondary"
                    : ""
                }`}
              >
                ≤ 400 ETB
              </Link>
            </li>
            <li>
              <Link
                href={href({ minPrice: "400", maxPrice: "1000" })}
                className={`block rounded-lg px-3 py-2.5 text-sm transition hover:bg-base-200 ${
                  filters.minPrice === "400" && filters.maxPrice === "1000"
                    ? "bg-secondary/10 font-semibold text-secondary"
                    : ""
                }`}
              >
                400 – 1 000 ETB
              </Link>
            </li>
            <li>
              <Link
                href={href({ minPrice: "1000", maxPrice: "" })}
                className={`block rounded-lg px-3 py-2.5 text-sm transition hover:bg-base-200 ${
                  filters.minPrice === "1000" && !filters.maxPrice
                    ? "bg-secondary/10 font-semibold text-secondary"
                    : ""
                }`}
              >
                ≥ 1 000 ETB
              </Link>
            </li>
          </ul>
        </details>

        <details className="group relative">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-base-300/90 bg-base-100 px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:border-secondary/35 hover:shadow-md [&::-webkit-details-marker]:hidden">
            <span className="text-xs font-normal text-base-content/50">
              Rating
            </span>
            {ratingLabel}
            <HiChevronDown className="h-4 w-4 shrink-0 opacity-60 transition group-open:rotate-180" />
          </summary>
          <ul className="absolute left-0 top-[calc(100%+8px)] z-30 min-w-[10rem] rounded-xl border border-base-300 bg-base-100 p-1.5 shadow-xl">
            <li>
              <Link
                href={href({ minRating: "" })}
                className={`block rounded-lg px-3 py-2.5 text-sm transition hover:bg-base-200 ${
                  !filters.minRating
                    ? "bg-secondary/10 font-semibold text-secondary"
                    : ""
                }`}
              >
                Any rating
              </Link>
            </li>
            <li>
              <Link
                href={href({ minRating: "4" })}
                className={`block rounded-lg px-3 py-2.5 text-sm transition hover:bg-base-200 ${
                  filters.minRating === "4"
                    ? "bg-secondary/10 font-semibold text-secondary"
                    : ""
                }`}
              >
                4★ or higher
              </Link>
            </li>
            <li>
              <Link
                href={href({ minRating: "4.5" })}
                className={`block rounded-lg px-3 py-2.5 text-sm transition hover:bg-base-200 ${
                  filters.minRating === "4.5"
                    ? "bg-secondary/10 font-semibold text-secondary"
                    : ""
                }`}
              >
                4.5★ or higher
              </Link>
            </li>
          </ul>
        </details>

        <details className="group relative">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-base-300/90 bg-base-100 px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:border-secondary/35 hover:shadow-md [&::-webkit-details-marker]:hidden">
            <span className="text-xs font-normal text-base-content/50">
              Max ship
            </span>
            {shipLabel}
            <HiChevronDown className="h-4 w-4 shrink-0 opacity-60 transition group-open:rotate-180" />
          </summary>
          <ul className="absolute left-0 top-[calc(100%+8px)] z-30 min-w-[11rem] rounded-xl border border-base-300 bg-base-100 p-1.5 shadow-xl">
            <li>
              <Link
                href={href({ minShip: "" })}
                className={`block rounded-lg px-3 py-2.5 text-sm transition hover:bg-base-200 ${
                  !filters.minShip
                    ? "bg-secondary/10 font-semibold text-secondary"
                    : ""
                }`}
              >
                Any capacity
              </Link>
            </li>
            <li>
              <Link
                href={href({ minShip: "100" })}
                className={`block rounded-lg px-3 py-2.5 text-sm transition hover:bg-base-200 ${
                  filters.minShip === "100"
                    ? "bg-secondary/10 font-semibold text-secondary"
                    : ""
                }`}
              >
                ≥ 100 / order
              </Link>
            </li>
            <li>
              <Link
                href={href({ minShip: "500" })}
                className={`block rounded-lg px-3 py-2.5 text-sm transition hover:bg-base-200 ${
                  filters.minShip === "500"
                    ? "bg-secondary/10 font-semibold text-secondary"
                    : ""
                }`}
              >
                ≥ 500 / order
              </Link>
            </li>
            <li>
              <Link
                href={href({ minShip: "1000" })}
                className={`block rounded-lg px-3 py-2.5 text-sm transition hover:bg-base-200 ${
                  filters.minShip === "1000"
                    ? "bg-secondary/10 font-semibold text-secondary"
                    : ""
                }`}
              >
                ≥ 1 000 / order
              </Link>
            </li>
          </ul>
        </details>

        {regions.length > 0 && (
          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-base-300/90 bg-base-100 px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:border-secondary/35 hover:shadow-md [&::-webkit-details-marker]:hidden">
              <span className="text-xs font-normal text-base-content/50">
                Region
              </span>
              <span className="max-w-[9rem] truncate sm:max-w-[12rem]">
                {regionLabel}
              </span>
              <HiChevronDown className="h-4 w-4 shrink-0 opacity-60 transition group-open:rotate-180" />
            </summary>
            <ul className="absolute left-0 top-[calc(100%+8px)] z-30 max-h-60 min-w-[12rem] max-w-[min(100vw-2rem,18rem)] overflow-y-auto overscroll-contain rounded-xl border border-base-300 bg-base-100 p-1.5 shadow-xl">
              <li>
                <Link
                  href={href({ region: "" })}
                  className={`block rounded-lg px-3 py-2.5 text-sm transition hover:bg-base-200 ${
                    !filters.region
                      ? "bg-secondary/10 font-semibold text-secondary"
                      : ""
                  }`}
                >
                  Any region
                </Link>
              </li>
              {regions.map((r) => (
                <li key={r}>
                  <Link
                    href={href({ region: r })}
                    className={`block rounded-lg px-3 py-2.5 text-sm transition hover:bg-base-200 ${
                      filters.region === r
                        ? "bg-secondary/10 font-semibold text-secondary"
                        : ""
                    }`}
                  >
                    {r}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        )}

        <details className="group relative">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-base-300/90 bg-base-100 px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:border-secondary/35 hover:shadow-md [&::-webkit-details-marker]:hidden">
            <span className="text-xs font-normal text-base-content/50">
              Availability
            </span>
            {stockLabel}
            <HiChevronDown className="h-4 w-4 shrink-0 opacity-60 transition group-open:rotate-180" />
          </summary>
          <ul className="absolute left-0 top-[calc(100%+8px)] z-30 min-w-[11rem] rounded-xl border border-base-300 bg-base-100 p-1.5 shadow-xl">
            <li>
              <Link
                href={href({ stock: "" })}
                className={`block rounded-lg px-3 py-2.5 text-sm transition hover:bg-base-200 ${
                  !filters.stock
                    ? "bg-secondary/10 font-semibold text-secondary"
                    : ""
                }`}
              >
                All listings
              </Link>
            </li>
            <li>
              <Link
                href={href({ stock: "in_stock" })}
                className={`block rounded-lg px-3 py-2.5 text-sm transition hover:bg-base-200 ${
                  filters.stock === "in_stock"
                    ? "bg-secondary/10 font-semibold text-secondary"
                    : ""
                }`}
              >
                In stock only
              </Link>
            </li>
          </ul>
        </details>
      </div>
    </div>
  );
}
