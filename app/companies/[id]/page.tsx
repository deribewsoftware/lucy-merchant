import Link from "next/link";
import { notFound } from "next/navigation";
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
import { ProductOrderSpecs } from "@/components/product-order-specs";
import { ProductUnitPrice } from "@/components/product-unit-price";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { getCompany, listProducts } from "@/lib/db/catalog";
import { listReviewsForCompany } from "@/lib/db/reviews";
import { findUserById } from "@/lib/db/users";
import { SectionHeader } from "@/components/ui/section-header";

type Params = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
};

export default async function CompanyPage({ params, searchParams }: Params) {
  const { id } = await params;
  const sp = await searchParams;
  const company = getCompany(id);
  if (!company) notFound();

  const pageRaw = parseInt(sp.page ?? "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;
  const pageSize = 12;

  const allProducts = listProducts()
    .filter((p) => p.companyId === id)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const total = allProducts.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const products = allProducts.slice(start, start + pageSize);

  const companyReviews = listReviewsForCompany(id).sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1,
  );

  const href = (p: number) => {
    const u = new URLSearchParams();
    if (p > 1) u.set("page", String(p));
    const q = u.toString();
    return q ? `/companies/${id}?${q}` : `/companies/${id}`;
  };

  return (
    <div className="container mx-auto max-w-6xl flex-1 px-4 py-8 sm:py-10">
      <div className="breadcrumbs text-sm">
        <ul>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href="/companies">Suppliers</Link>
          </li>
          <li>
            <Link href="/browse">Catalog</Link>
          </li>
          <li className="line-clamp-1">{company.name}</li>
        </ul>
      </div>

      <div className="card mt-6 border border-base-300 bg-base-100 shadow-lg">
        <div className="card-body gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-start">
            {company.logo && /^https?:\/\//i.test(company.logo) ? (
              <figure className="shrink-0 overflow-hidden rounded-xl border border-base-300 bg-base-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={company.logo}
                  alt=""
                  className="h-24 w-24 object-cover sm:h-28 sm:w-28"
                />
              </figure>
            ) : null}
            <div className="min-w-0 flex-1">
              <SectionHeader
                eyebrow="Supplier profile"
                title={company.name}
                description={company.description}
                icon={<HiOutlineBuildingOffice2 className="h-5 w-5" />}
              />
              <div className="mt-4 flex flex-wrap gap-2">
                {company.isVerified ? (
                  <span className="badge badge-success">Verified</span>
                ) : (
                  <span className="badge badge-warning">Verification pending</span>
                )}
                <span className="badge badge-outline">
                  {company.ratingAverage.toFixed(1)}★ · {company.totalReviews}{" "}
                  reviews
                </span>
              </div>
              {company.licenseDocument?.trim() ? (
                <p className="mt-3 text-xs text-base-content/60">
                  License / registration:{" "}
                  {/^https?:\/\//i.test(company.licenseDocument.trim()) ? (
                    <a
                      href={company.licenseDocument.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link link-primary font-medium"
                    >
                      View document
                    </a>
                  ) : (
                    <span className="font-mono text-base-content/80">
                      {company.licenseDocument.trim()}
                    </span>
                  )}
                </p>
              ) : null}
              {(company.businessAddress?.trim() ||
                (company.latitude != null &&
                  company.longitude != null &&
                  Number.isFinite(company.latitude) &&
                  Number.isFinite(company.longitude))) && (
                <div className="mt-4 rounded-xl border border-base-300 bg-base-200/25 p-4">
                  <h3 className="text-sm font-semibold text-base-content">
                    Location
                  </h3>
                  {company.businessAddress?.trim() ? (
                    <p className="mt-1.5 text-sm leading-relaxed text-base-content/80">
                      {company.businessAddress.trim()}
                    </p>
                  ) : null}
                  {company.latitude != null &&
                  company.longitude != null &&
                  Number.isFinite(company.latitude) &&
                  Number.isFinite(company.longitude) ? (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${company.latitude},${company.longitude}`,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-primary btn-sm mt-3"
                    >
                      Open in Google Maps
                    </a>
                  ) : null}
                </div>
              )}
            </div>
          </div>
          <Link href="/browse" className="btn btn-outline btn-primary shrink-0">
            Back to catalog
          </Link>
        </div>
      </div>

      {companyReviews.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-bold sm:text-2xl">
            Verified buyer reviews
          </h2>
          <p className="mt-1 text-sm text-base-content/65">
            Feedback from merchants after completed orders (verified purchases).
          </p>
          <ul className="mt-6 space-y-4">
            {companyReviews.map((r) => {
              const author = findUserById(r.merchantId);
              return (
                <li
                  key={r.id}
                  className="rounded-xl border border-base-300 bg-base-100 p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-semibold">
                      {author?.name ?? "Merchant"}
                    </span>
                    <span className="text-amber-600">
                      {r.rating}★ ·{" "}
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-base-content/80">
                    {r.comment}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <h2 className="font-display mt-10 text-xl font-bold sm:text-2xl">
        Listings from this supplier
      </h2>
      <p className="mt-1 text-sm text-base-content/65">
        Check MOQs, delivery windows, and unit pricing before you add to cart.
      </p>
      {total > 0 && (
        <p className="mt-2 text-sm text-base-content/55">
          Showing {start + 1}–{Math.min(start + pageSize, total)} of {total}{" "}
          listings
        </p>
      )}

      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.length === 0 && (
          <li className="col-span-full text-sm text-base-content/60">
            No published products yet.
          </li>
        )}
        {products.map((p) => (
          <li key={p.id}>
            <Link
              href={`/products/${p.id}`}
              className="card group h-full overflow-hidden border border-base-300 bg-base-100 shadow-md transition hover:border-primary/30 hover:shadow-lg"
            >
              {p.imageUrl ? (
                <figure className="relative aspect-[16/10] w-full overflow-hidden bg-base-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.imageUrl}
                    alt=""
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  />
                  {p.isFeatured ? (
                    <span className="badge badge-warning absolute end-2 top-2 text-[10px] uppercase">
                      Featured
                    </span>
                  ) : null}
                </figure>
              ) : null}
              <div className="card-body p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="card-title line-clamp-2 text-base">{p.name}</h3>
                  {p.isFeatured && !p.imageUrl ? (
                    <span className="badge badge-warning badge-sm shrink-0 uppercase">
                      Featured
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2 text-sm">
                  <ProductUnitPrice
                    price={p.price}
                    compareAtPrice={p.compareAtPrice}
                    saleClassName="font-bold text-primary"
                  />
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
        total={total}
        buildHref={href}
      />
    </div>
  );
}
