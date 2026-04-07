import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { BrowseCategoryDropdown } from "@/components/browse/browse-category-dropdown";
import { FilterDropdown } from "@/components/browse/filter-dropdown";
import type { Category } from "@/lib/domain/types";
import {
  buildBrowseHref,
  mergeFilters,
  type BrowseFilterState,
} from "@/lib/browse/browse-href";

export type { BrowseFilterState };

const SORT_OPTIONS: { value: string; label: string; hint: string }[] = [
  { value: "recent", label: "Most recent", hint: "Newest listings first" },
  { value: "orders", label: "Most ordered", hint: "Highest order volume" },
  { value: "rating", label: "Top rated", hint: "Best average ratings" },
  { value: "price_asc", label: "Price: low to high", hint: "Cheapest unit price first" },
  { value: "price_desc", label: "Price: high to low", hint: "Premium SKUs first" },
];

type Props = {
  sort: string;
  categoryId: string;
  categories: Category[];
  activeCategory: Category | undefined;
  regions: string[];
  filters: BrowseFilterState;
};

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

        {categories.length > 0 && (
          <BrowseCategoryDropdown
            sort={sort}
            categoryId={categoryId}
            categories={categories}
            activeCategory={activeCategory}
            filters={filters}
          />
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
