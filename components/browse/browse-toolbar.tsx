import Link from "next/link";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import type { Category } from "@/lib/domain/types";

const SORT_OPTIONS: { value: string; label: string; hint: string }[] = [
  { value: "recent", label: "Most recent", hint: "Newest listings first" },
  { value: "orders", label: "Most ordered", hint: "Highest order volume" },
  { value: "rating", label: "Top rated", hint: "Best average ratings" },
  { value: "price_asc", label: "Price: low to high", hint: "Cheapest unit price first" },
  { value: "price_desc", label: "Price: high to low", hint: "Premium SKUs first" },
];

export type BrowseFilterState = {
  minPrice: string;
  maxPrice: string;
  minRating: string;
  stock: string;
  minShip: string;
  region: string;
};

type Props = {
  sort: string;
  categoryId: string;
  categories: Category[];
  activeCategory: Category | undefined;
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
      ? "Under 400 ETB"
      : filters.minPrice === "400" && filters.maxPrice === "1000"
        ? "400 - 1,000 ETB"
        : filters.minPrice === "1000" && !filters.maxPrice
          ? "Over 1,000 ETB"
          : "Any price";

  const ratingLabel =
    filters.minRating === "4"
      ? "4+ stars"
      : filters.minRating === "4.5"
        ? "4.5+ stars"
        : "Any rating";

  const stockLabel = filters.stock === "in_stock" ? "In stock" : "All stock";

  const shipLabel =
    filters.minShip === "100"
      ? "Min 100"
      : filters.minShip === "500"
        ? "Min 500"
        : filters.minShip === "1000"
          ? "Min 1,000"
          : "Any capacity";

  const regionLabel = filters.region || "Any region";

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <SlidersHorizontal className="h-4 w-4" />
        Filters
      </div>
      <div className="flex flex-wrap gap-2">
        {/* Sort Dropdown */}
        <FilterDropdown
          label="Sort"
          value={sortLabel}
        >
          {SORT_OPTIONS.map((o) => (
            <Link
              key={o.value}
              href={buildBrowseHref(o.value, activeCategory?.id ?? "", filters)}
              className={`flex flex-col rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted ${
                sort === o.value ? "bg-primary/10 text-primary" : "text-foreground"
              }`}
            >
              <span className="font-medium">{o.label}</span>
              <span className="text-xs text-muted-foreground">{o.hint}</span>
            </Link>
          ))}
        </FilterDropdown>

        {/* Category Dropdown */}
        {categories.length > 0 && (
          <FilterDropdown
            label="Category"
            value={categoryLabel}
          >
            <Link
              href={buildBrowseHref(sort, "", filters)}
              className={`block rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted ${
                !activeCategory ? "bg-primary/10 text-primary" : "text-foreground"
              }`}
            >
              All categories
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={buildBrowseHref(sort, c.id, filters)}
                className={`block rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted ${
                  categoryId === c.id ? "bg-primary/10 text-primary" : "text-foreground"
                }`}
              >
                {c.name}
              </Link>
            ))}
          </FilterDropdown>
        )}

        {/* Price Dropdown */}
        <FilterDropdown label="Price" value={priceLabel}>
          <Link
            href={href({ minPrice: "", maxPrice: "" })}
            className={`block rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted ${
              !filters.minPrice && !filters.maxPrice ? "bg-primary/10 text-primary" : "text-foreground"
            }`}
          >
            Any price
          </Link>
          <Link
            href={href({ minPrice: "", maxPrice: "400" })}
            className={`block rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted ${
              filters.maxPrice === "400" && !filters.minPrice ? "bg-primary/10 text-primary" : "text-foreground"
            }`}
          >
            Under 400 ETB
          </Link>
          <Link
            href={href({ minPrice: "400", maxPrice: "1000" })}
            className={`block rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted ${
              filters.minPrice === "400" && filters.maxPrice === "1000" ? "bg-primary/10 text-primary" : "text-foreground"
            }`}
          >
            400 - 1,000 ETB
          </Link>
          <Link
            href={href({ minPrice: "1000", maxPrice: "" })}
            className={`block rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted ${
              filters.minPrice === "1000" && !filters.maxPrice ? "bg-primary/10 text-primary" : "text-foreground"
            }`}
          >
            Over 1,000 ETB
          </Link>
        </FilterDropdown>

        {/* Rating Dropdown */}
        <FilterDropdown label="Rating" value={ratingLabel}>
          <Link
            href={href({ minRating: "" })}
            className={`block rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted ${
              !filters.minRating ? "bg-primary/10 text-primary" : "text-foreground"
            }`}
          >
            Any rating
          </Link>
          <Link
            href={href({ minRating: "4" })}
            className={`block rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted ${
              filters.minRating === "4" ? "bg-primary/10 text-primary" : "text-foreground"
            }`}
          >
            4+ stars
          </Link>
          <Link
            href={href({ minRating: "4.5" })}
            className={`block rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted ${
              filters.minRating === "4.5" ? "bg-primary/10 text-primary" : "text-foreground"
            }`}
          >
            4.5+ stars
          </Link>
        </FilterDropdown>

        {/* Capacity Dropdown */}
        <FilterDropdown label="Capacity" value={shipLabel}>
          <Link
            href={href({ minShip: "" })}
            className={`block rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted ${
              !filters.minShip ? "bg-primary/10 text-primary" : "text-foreground"
            }`}
          >
            Any capacity
          </Link>
          <Link
            href={href({ minShip: "100" })}
            className={`block rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted ${
              filters.minShip === "100" ? "bg-primary/10 text-primary" : "text-foreground"
            }`}
          >
            Min 100 / order
          </Link>
          <Link
            href={href({ minShip: "500" })}
            className={`block rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted ${
              filters.minShip === "500" ? "bg-primary/10 text-primary" : "text-foreground"
            }`}
          >
            Min 500 / order
          </Link>
          <Link
            href={href({ minShip: "1000" })}
            className={`block rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted ${
              filters.minShip === "1000" ? "bg-primary/10 text-primary" : "text-foreground"
            }`}
          >
            Min 1,000 / order
          </Link>
        </FilterDropdown>

        {/* Region Dropdown */}
        {regions.length > 0 && (
          <FilterDropdown label="Region" value={regionLabel}>
            <Link
              href={href({ region: "" })}
              className={`block rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted ${
                !filters.region ? "bg-primary/10 text-primary" : "text-foreground"
              }`}
            >
              Any region
            </Link>
            {regions.map((r) => (
              <Link
                key={r}
                href={href({ region: r })}
                className={`block rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted ${
                  filters.region === r ? "bg-primary/10 text-primary" : "text-foreground"
                }`}
              >
                {r}
              </Link>
            ))}
          </FilterDropdown>
        )}

        {/* Stock Dropdown */}
        <FilterDropdown label="Stock" value={stockLabel}>
          <Link
            href={href({ stock: "" })}
            className={`block rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted ${
              !filters.stock ? "bg-primary/10 text-primary" : "text-foreground"
            }`}
          >
            All listings
          </Link>
          <Link
            href={href({ stock: "in_stock" })}
            className={`block rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted ${
              filters.stock === "in_stock" ? "bg-primary/10 text-primary" : "text-foreground"
            }`}
          >
            In stock only
          </Link>
        </FilterDropdown>
      </div>
    </div>
  );
}

function FilterDropdown({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition-all hover:border-primary/30 hover:bg-muted [&::-webkit-details-marker]:hidden">
        <span className="text-xs text-muted-foreground">{label}:</span>
        <span className="max-w-[10rem] truncate text-foreground">{value}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="absolute left-0 top-[calc(100%+4px)] z-30 min-w-[12rem] max-w-[min(100vw-2rem,18rem)] max-h-60 overflow-y-auto rounded-lg border border-border bg-card p-1 shadow-xl">
        {children}
      </div>
    </details>
  );
}
