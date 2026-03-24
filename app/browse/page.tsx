import Link from "next/link";
import { HiOutlineSquares2X2 } from "react-icons/hi2";
import { BrowseToolbar } from "@/components/browse/browse-toolbar";
import { ProductOrderSpecs } from "@/components/product-order-specs";
import { ProductUnitPrice } from "@/components/product-unit-price";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { getCategories, listProducts } from "@/lib/db/catalog";
import { SectionHeader } from "@/components/ui/section-header";

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
    products = products.filter((p) => p.maxDeliveryQuantity >= minShipN);
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

  return (
    <div className="container mx-auto max-w-6xl flex-1 px-4 py-8 sm:py-10">
      <SectionHeader
        eyebrow="Curated for procurement velocity"
        title="The catalog that keeps pace with your ops"
        description="Use the sort and category menus to tune the grid—same filters as your global search category narrow."
        icon={<HiOutlineSquares2X2 className="h-5 w-5" />}
      />

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

      {categoryId && !activeCategory && (
        <p className="alert alert-warning mt-6 text-sm">
          Unknown category filter — showing all products.{" "}
          <Link href="/browse" className="link link-hover font-semibold">
            Clear filter
          </Link>
        </p>
      )}

      {activeCategory && (
        <p className="mt-4 text-sm text-base-content/70">
          Showing listings in <strong>{activeCategory.name}</strong>.{" "}
          <Link href={`/browse?sort=${sort}`} className="link link-primary">
            Clear category
          </Link>
        </p>
      )}

      {regionFilter && (
        <p className="mt-2 text-sm text-base-content/70">
          Region: <strong>{regionFilter}</strong>.{" "}
          <Link href={clearRegionHref} className="link link-primary">
            Clear region
          </Link>
        </p>
      )}

      <p className="mt-4 text-sm text-base-content/60">
        {totalCount === 0
          ? "No listings match these filters."
          : `Showing ${pageStart + 1}–${Math.min(pageStart + pageSize, totalCount)} of ${totalCount}`}
      </p>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pageItems.map((p) => (
          <li key={p.id}>
            <Link
              href={`/products/${p.id}`}
              className="card group h-full overflow-hidden border border-base-300 bg-base-100 shadow-md transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl"
            >
              {p.imageUrl ? (
                <figure className="relative aspect-[16/10] w-full overflow-hidden bg-base-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.imageUrl}
                    alt=""
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  />
                  {p.isFeatured && (
                    <span className="badge badge-warning absolute end-2 top-2 gap-0 border-0 text-[10px] uppercase">
                      Featured
                    </span>
                  )}
                </figure>
              ) : null}
              <div className="card-body p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="card-title line-clamp-2 text-base font-semibold leading-snug group-hover:text-primary">
                    {p.name}
                  </h2>
                  {p.isFeatured && !p.imageUrl && (
                    <span className="badge badge-warning badge-sm shrink-0 uppercase">
                      Featured
                    </span>
                  )}
                </div>
                <p className="line-clamp-2 text-sm text-base-content/65">
                  {p.description}
                </p>
                <div className="card-actions mt-auto flex flex-col gap-2 pt-3">
                  <p className="text-sm">
                    <ProductUnitPrice
                      price={p.price}
                      compareAtPrice={p.compareAtPrice}
                      saleClassName="font-bold text-primary"
                    />
                  </p>
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
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <PaginationBar
        page={safePage}
        pageSize={pageSize}
        total={totalCount}
        buildHref={browseHref}
      />
    </div>
  );
}
