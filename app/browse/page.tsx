import Link from "next/link";
import { redirect } from "next/navigation";
import { Filter, Grid3X3, Package, Star, X } from "lucide-react";
import { BrowseToolbar } from "@/components/browse/browse-toolbar";
import { ProductOrderSpecs } from "@/components/product-order-specs";
import { ProductUnitPrice } from "@/components/product-unit-price";
import { PaginationBar, PaginationSummary } from "@/components/ui/pagination-bar";
import { effectiveMaxDeliveryPerOrder } from "@/lib/domain/max-delivery";
import { getCategories, listProducts } from "@/lib/db/catalog";
import { merchantHasOutstandingCommission } from "@/lib/server/merchant-commission";
import { stripHtmlToPlainText } from "@/lib/rich-text";
import { getSessionUser } from "@/lib/server/session";

type Props = {
  searchParams: Promise<{
    sort?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    minRating?: string;
    stock?: string;
    minShip?: string;
    region?: string;
    page?: string;
  }>;
};

export default async function BrowsePage({ searchParams }: Props) {
  const sessionUser = await getSessionUser();
  if (
    sessionUser?.role === "merchant" &&
    merchantHasOutstandingCommission(sessionUser.id)
  ) {
    redirect("/merchant/orders?hold=commission");
  }

  const sp = await searchParams;
  const sort = sp.sort ?? "recent";
  const categoryId = sp.category?.trim() ?? "";
  const minPrice = sp.minPrice?.trim() ?? "";
  const maxPrice = sp.maxPrice?.trim() ?? "";
  const minRating = sp.minRating?.trim() ?? "";
  const stock = sp.stock?.trim() ?? "";
  const minShip = sp.minShip?.trim() ?? "";
  const regionFilter = sp.region?.trim() ?? "";
  const pageRaw = parseInt(sp.page ?? "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;
  const pageSize = 12;

  const categories = getCategories();
  const activeCategory = categoryId
    ? categories.find((c) => c.id === categoryId)
    : undefined;

  const regionSource = activeCategory
    ? listProducts().filter((p) => p.categoryId === activeCategory.id)
    : listProducts();
  const regionOptions = [
    ...new Set(
      regionSource
        .map((p) => p.shipFromRegion?.trim())
        .filter((r): r is string => Boolean(r)),
    ),
  ].sort((a, b) => a.localeCompare(b));

  let products = [...listProducts()];
  if (activeCategory) {
    products = products.filter((p) => p.categoryId === activeCategory.id);
  }

  if (regionFilter) {
    products = products.filter(
      (p) => (p.shipFromRegion ?? "").trim() === regionFilter,
    );
  }

  const minP = parseFloat(minPrice);
  if (minPrice !== "" && !Number.isNaN(minP)) {
    products = products.filter((p) => p.price >= minP);
  }
  const maxP = parseFloat(maxPrice);
  if (maxPrice !== "" && !Number.isNaN(maxP)) {
    products = products.filter((p) => p.price <= maxP);
  }
  const minR = parseFloat(minRating);
  if (minRating !== "" && !Number.isNaN(minR)) {
    products = products.filter((p) => p.averageRating >= minR);
  }
  if (stock === "in_stock") {
    products = products.filter((p) => p.availableQuantity > 0);
  }

  const minShipN = parseInt(minShip, 10);
  if (minShip !== "" && !Number.isNaN(minShipN)) {
    products = products.filter(
      (p) => effectiveMaxDeliveryPerOrder(p) >= minShipN,
    );
  }

  const feat = (a: (typeof products)[0], b: (typeof products)[0]) =>
    Number(!!b.isFeatured) - Number(!!a.isFeatured);

  if (sort === "orders") {
    products.sort(
      (a, b) => feat(a, b) || b.totalOrdersCount - a.totalOrdersCount,
    );
  } else if (sort === "rating") {
    products.sort((a, b) => feat(a, b) || b.averageRating - a.averageRating);
  } else if (sort === "price_asc") {
    products.sort((a, b) => feat(a, b) || a.price - b.price);
  } else if (sort === "price_desc") {
    products.sort((a, b) => feat(a, b) || b.price - a.price);
  } else {
    products.sort(
      (a, b) => feat(a, b) || (a.createdAt < b.createdAt ? 1 : -1),
    );
  }

  const totalCount = products.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const pageItems = products.slice(pageStart, pageStart + pageSize);

  function browseQuery(p: number, withRegion: boolean) {
    const u = new URLSearchParams();
    u.set("sort", sort);
    if (categoryId) u.set("category", categoryId);
    if (minPrice) u.set("minPrice", minPrice);
    if (maxPrice) u.set("maxPrice", maxPrice);
    if (minRating) u.set("minRating", minRating);
    if (stock) u.set("stock", stock);
    if (minShip) u.set("minShip", minShip);
    if (withRegion && regionFilter) u.set("region", regionFilter);
    if (p > 1) u.set("page", String(p));
    return u.toString();
  }

  const browseHref = (p: number) => `/browse?${browseQuery(p, true)}`;
  const clearRegionHref = `/browse?${browseQuery(1, false)}`;

  const hasActiveFilters = categoryId || regionFilter || minPrice || maxPrice || minRating || stock || minShip;

  return (
    <div className="flex flex-col">
      {/* Page Header */}
      <div className="border-b border-border/35 bg-card/30">
        <div className="lm-container py-6 sm:py-10 lg:py-12">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Grid3X3 className="h-6 w-6" />
            </div>
            <div>
              <span className="lm-eyebrow">Product Catalog</span>
              <h1 className="lm-heading-section mt-1">Browse Products</h1>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Discover quality products from verified suppliers. Use filters to narrow down your search.
          </p>
        </div>
      </div>

      <div className="lm-container py-5 pb-8 sm:py-6 sm:pb-10 lg:py-8">
        {/* Toolbar */}
        <BrowseToolbar
          sort={sort}
          categoryId={categoryId}
          categories={categories}
          activeCategory={activeCategory}
          regions={regionOptions}
          filters={{
            minPrice,
            maxPrice,
            minRating,
            stock,
            minShip,
            region: regionFilter,
          }}
        />

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              Active filters:
            </span>
            {activeCategory && (
              <Link
                href={`/browse?sort=${sort}`}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
              >
                {activeCategory.name}
                <X className="h-3 w-3" />
              </Link>
            )}
            {regionFilter && (
              <Link
                href={clearRegionHref}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
              >
                {regionFilter}
                <X className="h-3 w-3" />
              </Link>
            )}
            {(minPrice || maxPrice) && (
              <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
                Price: {minPrice || '0'} - {maxPrice || 'Any'}
              </span>
            )}
            {minRating && (
              <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
                Min Rating: {minRating}
              </span>
            )}
            {stock === "in_stock" && (
              <span className="rounded-full bg-success/10 px-3 py-1 text-sm text-success">
                In Stock Only
              </span>
            )}
          </div>
        )}

        {/* Results Count */}
        <div className="mt-6 flex items-center justify-between">
          {totalCount === 0 ? (
            <p className="text-sm text-muted-foreground">No products match your filters</p>
          ) : (
            <PaginationSummary
              page={safePage}
              pageSize={pageSize}
              total={totalCount}
              suffix="products"
            />
          )}
        </div>

        {/* Product Grid */}
        {pageItems.length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pageItems.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                className="lm-card lm-card-interactive group flex flex-col overflow-hidden p-0"
              >
                {/* Image */}
                {p.imageUrl && (
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.imageUrl}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {p.isFeatured && (
                      <span className="absolute right-3 top-3 rounded-full bg-warning/90 px-2.5 py-1 text-xs font-semibold text-warning-foreground">
                        Featured
                      </span>
                    )}
                  </div>
                )}
                
                {/* Content */}
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="line-clamp-2 font-display text-base font-semibold text-foreground transition-colors group-hover:text-primary">
                      {p.name}
                    </h2>
                    {p.isFeatured && !p.imageUrl && (
                      <span className="shrink-0 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
                        Featured
                      </span>
                    )}
                  </div>
                  
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {stripHtmlToPlainText(p.description)}
                  </p>

                  {/* Rating */}
                  {p.averageRating > 0 && (
                    <div className="mt-3 flex items-center gap-1">
                      <Star className="h-4 w-4 fill-warning text-warning" />
                      <span className="text-sm font-medium text-foreground">
                        {p.averageRating.toFixed(1)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ({p.totalOrdersCount} orders)
                      </span>
                    </div>
                  )}

                  {/* Specs */}
                  <div className="mt-3">
                    <ProductOrderSpecs
                      size="sm"
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
                  </div>

                  {/* Price */}
                  <div className="mt-auto pt-4">
                    <ProductUnitPrice
                      price={p.price}
                      compareAtPrice={p.compareAtPrice}
                      saleClassName="text-lg font-bold text-primary"
                      strikeClassName="text-sm text-muted-foreground line-through"
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-12 flex flex-col items-center justify-center rounded-xl border border-dashed border-border/40 py-16 text-center">
            <Package className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
              No products found
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Try adjusting your filters or search criteria
            </p>
            <Link
              href="/browse"
              className="mt-6 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Clear all filters
            </Link>
          </div>
        )}

        {/* Pagination */}
        <PaginationBar
          page={safePage}
          pageSize={pageSize}
          total={totalCount}
          buildHref={browseHref}
        />
      </div>
    </div>
  );
}
