import Link from "next/link";
import { ProductOrderSpecs } from "@/components/product-order-specs";
import { ProductUnitPrice } from "@/components/product-unit-price";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/add-to-cart";
import { ProductComments } from "@/components/product-comments";
import { RelatedProducts } from "@/components/related-products";
import {
  getCompany,
  getProduct,
  incrementProductViewCount,
  listRelatedProducts,
} from "@/lib/db/catalog";
import { listReviewsForProduct } from "@/lib/db/product-reviews";
import { findUserById } from "@/lib/db/users";
import { getSessionUser } from "@/lib/server/session";

type Params = { params: Promise<{ id: string }> };

export default async function ProductPage({ params }: Params) {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) notFound();
  incrementProductViewCount(id);
  const company = getCompany(product.companyId);
  const user = await getSessionUser();
  const isMerchant = user?.role === "merchant";
  const canComment =
    user?.role === "merchant" ||
    user?.role === "supplier" ||
    user?.role === "admin";
  const defaultQty = Math.min(
    Math.max(product.minOrderQuantity, 1),
    Math.min(product.availableQuantity, product.maxDeliveryQuantity),
  );
  const productReviews = listReviewsForProduct(product.id);
  const related = listRelatedProducts(product.id, 4);

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
          <li className="line-clamp-1">{product.name}</li>
        </ul>
      </div>

      <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="card min-w-0 flex-1 overflow-hidden border border-base-300 bg-base-100 shadow-lg">
          {product.imageUrl ? (
            <figure className="relative aspect-[2/1] max-h-80 w-full bg-base-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.imageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
              {product.isFeatured ? (
                <span className="badge badge-warning absolute end-4 top-4 uppercase">
                  Featured listing
                </span>
              ) : null}
            </figure>
          ) : null}
          <div className="card-body gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold sm:text-3xl lg:text-4xl">
                  {product.name}
                </h1>
                {product.isFeatured && !product.imageUrl ? (
                  <span className="badge badge-warning badge-lg uppercase">
                    Featured
                  </span>
                ) : null}
              </div>
              {company && (
                <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-base-content/70">
                  <span>
                    Sold by{" "}
                    <span className="font-semibold text-base-content">
                      {company.name}
                    </span>
                  </span>
                  {company.isVerified ? (
                    <span className="badge badge-success badge-sm">Verified</span>
                  ) : (
                    <span className="badge badge-warning badge-sm">Pending</span>
                  )}
                </p>
              )}
            </div>
            <p className="text-base leading-relaxed text-base-content/80">
              {product.description}
            </p>
            <div className="flex flex-wrap gap-2">
              {product.tags.map((t) => (
                <span key={t} className="badge badge-outline badge-sm">
                  {t}
                </span>
              ))}
            </div>
            {product.shipFromRegion ? (
              <p className="text-sm text-base-content/70">
                Ships from{" "}
                <Link
                  href={`/browse?region=${encodeURIComponent(product.shipFromRegion)}`}
                  className="link link-primary font-medium"
                >
                  {product.shipFromRegion}
                </Link>
                {" — "}
                <Link
                  href={`/browse?region=${encodeURIComponent(product.shipFromRegion)}&category=${encodeURIComponent(product.categoryId)}`}
                  className="link link-hover"
                >
                  Same region in this category
                </Link>
              </p>
            ) : null}
            <div className="stats stats-vertical shadow sm:stats-horizontal">
              <div className="stat place-items-center border-base-300 sm:border-e">
                <div className="stat-title">Price</div>
                <div className="stat-value text-lg sm:text-2xl">
                  <ProductUnitPrice
                    variant="stacked"
                    price={product.price}
                    compareAtPrice={product.compareAtPrice}
                    strikeClassName="text-base-content/50 line-through decoration-base-content/40 text-base sm:text-lg"
                    saleClassName="text-lg font-bold text-primary sm:text-2xl"
                  />
                </div>
              </div>
              <div className="stat place-items-center border-base-300 sm:border-e">
                <div className="stat-title">Delivery</div>
                <div className="stat-value text-sm font-medium sm:text-lg">
                  {product.deliveryTime}
                </div>
              </div>
              <div className="stat place-items-center border-base-300 sm:border-e">
                <div className="stat-title">Buyer rating</div>
                <div className="stat-value text-lg text-amber-600 sm:text-2xl">
                  {productReviews.length > 0
                    ? `${product.averageRating.toFixed(1)}★`
                    : "—"}
                </div>
                <div className="stat-desc">
                  {productReviews.length > 0
                    ? `${productReviews.length} verified ${
                        productReviews.length === 1 ? "review" : "reviews"
                      }`
                    : "No verified reviews yet"}
                </div>
              </div>
              <div className="stat place-items-center">
                <div className="stat-title">Stock</div>
                <div className="stat-value text-lg sm:text-2xl">
                  {product.availableQuantity}
                </div>
                <div className="stat-desc max-w-none text-start">
                  <ProductOrderSpecs
                    size="sm"
                    includeStock={false}
                    includeLeadTime={false}
                    product={product}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="w-full shrink-0 lg:sticky lg:top-24 lg:w-80">
          <AddToCart
            productId={product.id}
            minQty={product.minOrderQuantity}
            maxQty={product.maxDeliveryQuantity}
            stock={product.availableQuantity}
            defaultQty={defaultQty}
            isMerchant={isMerchant}
          />
        </aside>
      </div>

      {productReviews.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold">Verified product reviews</h2>
          <p className="mt-1 text-sm text-base-content/65">
            From merchants after completed orders (verified purchases).
          </p>
          <ul className="mt-6 space-y-4">
            {productReviews.map((r) => {
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

      <RelatedProducts products={related} />

      <ProductComments
        productId={product.id}
        canPost={!!canComment}
        currentUserId={user?.id ?? null}
      />
    </div>
  );
}
