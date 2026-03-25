import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  ChevronRight,
  Clock,
  MapPin,
  Package,
  Shield,
  Sparkles,
  Star,
  Tag,
  Truck,
  Users,
} from "lucide-react";
import { ProductOrderSpecs } from "@/components/product-order-specs";
import { ProductUnitPrice } from "@/components/product-unit-price";
import { AddToCart } from "@/components/add-to-cart";
import { ProductComments } from "@/components/product-comments";
import { RelatedProducts } from "@/components/related-products";
import { RichTextContent } from "@/components/rich-text-content";
import {
  getCompany,
  getProduct,
  incrementProductViewCount,
  listRelatedProducts,
} from "@/lib/db/catalog";
import { listReviewsForProduct } from "@/lib/db/product-reviews";
import { findUserById } from "@/lib/db/users";
import { merchantHasOutstandingCommission } from "@/lib/server/merchant-commission";
import { getSessionUser } from "@/lib/server/session";

type Params = { params: Promise<{ id: string }> };

export default async function ProductPage({ params }: Params) {
  const sessionUser = await getSessionUser();
  if (
    sessionUser?.role === "merchant" &&
    merchantHasOutstandingCommission(sessionUser.id)
  ) {
    redirect("/merchant/orders?hold=commission");
  }

  const { id } = await params;
  const product = getProduct(id);
  if (!product) notFound();
  incrementProductViewCount(id);
  const company = getCompany(product.companyId);
  const user = sessionUser;
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
  const related = listRelatedProducts(product.id, 12);
  const hasReviews = productReviews.length > 0;

  return (
    <div className="flex min-w-0 flex-col bg-gradient-to-b from-base-100 via-base-100 to-base-200/30">
      {/* Top bar: breadcrumb + back */}
      <div className="border-b border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="lm-container py-3 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <nav
              className="flex min-w-0 items-center gap-1.5 text-sm"
              aria-label="Breadcrumb"
            >
              <Link
                href="/"
                className="shrink-0 text-muted-foreground transition-colors hover:text-primary"
              >
                Home
              </Link>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
              <Link
                href="/browse"
                className="shrink-0 text-muted-foreground transition-colors hover:text-primary"
              >
                Catalog
              </Link>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
              <span className="truncate font-medium text-foreground">
                {product.name}
              </span>
            </nav>
            <Link
              href="/browse"
              className="inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-base-100/80 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:border-primary/35 hover:text-primary sm:text-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to catalog
            </Link>
          </div>
        </div>
      </div>

      <div className="lm-container py-6 sm:py-8 lg:py-12">
        <div className="flex flex-col gap-10 lg:grid lg:grid-cols-12 lg:items-start lg:gap-10 xl:gap-14">
          {/* Main column */}
          <div className="min-w-0 space-y-10 lg:col-span-8 xl:space-y-12">
            {/* Hero card */}
            <article className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-lg shadow-black/[0.04] ring-1 ring-border/25">
              {product.imageUrl ? (
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted sm:aspect-[16/9] lg:aspect-[2/1]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    sizes="(max-width: 1024px) 100vw, 66vw"
                  />
                  <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-base-100/50 via-transparent to-transparent"
                    aria-hidden
                  />
                  {product.isFeatured && (
                    <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-warning px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-warning-foreground shadow-md sm:right-4 sm:top-4 sm:text-sm">
                      <Sparkles className="h-3.5 w-3.5" />
                      Featured
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 bg-gradient-to-br from-muted/80 to-muted sm:aspect-[16/9] lg:aspect-[2/1]">
                  <Package className="h-14 w-14 text-muted-foreground/40" />
                  <span className="text-sm font-medium text-muted-foreground">
                    No product image
                  </span>
                  {product.isFeatured && (
                    <span className="mt-2 rounded-full bg-warning/90 px-3 py-1 text-xs font-bold uppercase text-warning-foreground">
                      Featured listing
                    </span>
                  )}
                </div>
              )}

              <div className="border-t border-border/40 p-6 sm:p-8 lg:p-10">
                <p className="lm-eyebrow text-[10px] sm:text-xs">Product detail</p>
                <div className="mt-2 flex flex-wrap items-start gap-3">
                  <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                    {product.name}
                  </h1>
                </div>

                {company && (
                  <Link
                    href={`/companies/${company.id}`}
                    className="mt-5 flex w-full max-w-md items-center gap-3 rounded-xl border border-border/50 bg-base-200/30 p-3 transition-colors hover:border-primary/30 hover:bg-primary/[0.06] sm:p-4"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-base font-bold text-primary">
                      {company.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-semibold text-foreground">
                          {company.name}
                        </span>
                        {company.isVerified && (
                          <BadgeCheck
                            className="h-4 w-4 shrink-0 text-success"
                            aria-label="Verified supplier"
                          />
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        View supplier profile →
                      </span>
                    </div>
                  </Link>
                )}

                <div className="mt-6">
                  <RichTextContent
                    html={product.description}
                    variant="muted"
                  />
                </div>

                {product.tags.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {product.tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground sm:text-sm"
                      >
                        <Tag className="h-3 w-3 shrink-0 opacity-70" />
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {product.shipFromRegion && (
                  <div className="mt-5">
                    <Link
                      href={`/browse?region=${encodeURIComponent(product.shipFromRegion)}`}
                      className="inline-flex items-center gap-2 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                    >
                      <MapPin className="h-4 w-4 shrink-0 text-primary/80" />
                      Ships from{" "}
                      <span className="text-foreground underline-offset-2 hover:underline">
                        {product.shipFromRegion}
                      </span>
                    </Link>
                  </div>
                )}

                {/* Stats: horizontal snap on small screens */}
                <div className="mt-8 -mx-1 sm:mx-0">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    At a glance
                  </p>
                  <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden">
                    <div className="lm-stat min-w-[min(100%,10.5rem)] shrink-0 snap-start sm:min-w-0">
                      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:text-sm">
                        <Package className="h-4 w-4 text-primary" />
                        Price
                      </div>
                      <div className="mt-2">
                        <ProductUnitPrice
                          variant="stacked"
                          price={product.price}
                          compareAtPrice={product.compareAtPrice}
                          strikeClassName="text-muted-foreground line-through text-sm"
                          saleClassName="text-xl font-bold text-primary sm:text-2xl"
                        />
                      </div>
                    </div>

                    <div className="lm-stat min-w-[min(100%,10.5rem)] shrink-0 snap-start sm:min-w-0">
                      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:text-sm">
                        <Truck className="h-4 w-4 text-primary" />
                        Delivery
                      </div>
                      <p className="mt-2 text-lg font-semibold leading-snug text-foreground sm:text-xl">
                        {product.deliveryTime}
                      </p>
                    </div>

                    <div className="lm-stat min-w-[min(100%,10.5rem)] shrink-0 snap-start sm:min-w-0">
                      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:text-sm">
                        <Star className="h-4 w-4 text-warning" />
                        Rating
                      </div>
                      <p className="mt-2 text-lg font-semibold text-warning sm:text-xl">
                        {hasReviews
                          ? `${product.averageRating.toFixed(1)} / 5`
                          : "No reviews"}
                      </p>
                      {hasReviews && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {productReviews.length} verified
                        </p>
                      )}
                    </div>

                    <div className="lm-stat min-w-[min(100%,10.5rem)] shrink-0 snap-start sm:min-w-0">
                      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:text-sm">
                        <Users className="h-4 w-4 text-primary" />
                        Stock
                      </div>
                      <p className="mt-2 text-lg font-semibold tabular-nums text-foreground sm:text-xl">
                        {product.availableQuantity.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">units</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 rounded-xl border border-border/50 bg-gradient-to-br from-base-200/40 to-transparent p-5 sm:p-6">
                  <h2 className="flex items-center gap-2 font-display text-base font-semibold text-foreground sm:text-lg">
                    <Clock className="h-5 w-5 shrink-0 text-primary" />
                    Order specifications
                  </h2>
                  <div className="mt-4">
                    <ProductOrderSpecs
                      size="sm"
                      includeStock={false}
                      includeLeadTime={false}
                      product={product}
                    />
                  </div>
                </div>
              </div>
            </article>

            {/* Reviews */}
            {hasReviews && (
              <section className="rounded-2xl border border-border/50 bg-card/80 p-6 shadow-sm ring-1 ring-border/20 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="flex items-center gap-2 font-display text-xl font-bold text-foreground sm:text-2xl">
                      <Shield className="h-6 w-6 shrink-0 text-success" />
                      Verified reviews
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      From merchants who completed a purchase
                    </p>
                  </div>
                  <span className="rounded-full bg-success/12 px-3 py-1.5 text-sm font-semibold text-success">
                    {productReviews.length} review
                    {productReviews.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <ul className="mt-6 space-y-4">
                  {productReviews.map((r) => {
                    const author = findUserById(r.merchantId);
                    return (
                      <li
                        key={r.id}
                        className="rounded-xl border border-border/40 bg-base-100/80 p-4 sm:p-5"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/12 text-sm font-bold text-primary">
                              {(author?.name ?? "M").charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">
                                {author?.name ?? "Merchant"}
                              </p>
                              <time
                                className="text-xs text-muted-foreground"
                                dateTime={r.createdAt}
                              >
                                {new Date(r.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  },
                                )}
                              </time>
                            </div>
                          </div>
                          <div
                            className="flex shrink-0 items-center gap-0.5"
                            aria-label={`${r.rating} out of 5 stars`}
                          >
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 sm:h-[1.125rem] sm:w-[1.125rem] ${
                                  i < r.rating
                                    ? "fill-warning text-warning"
                                    : "text-muted"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                          <RichTextContent html={r.comment} variant="muted" />
                        </div>
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

          {/* Sidebar — order panel */}
          <aside className="min-w-0 lg:col-span-4 lg:sticky lg:top-24 lg:self-start xl:top-28">
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
      </div>
    </div>
  );
}
