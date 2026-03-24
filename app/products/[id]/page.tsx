import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  ChevronRight,
  Clock,
  MapPin,
  Package,
  Shield,
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
    <div className="flex flex-col">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-card/30">
        <div className="lm-container py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Home
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Link
              href="/browse"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Catalog
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="truncate text-foreground">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="lm-container py-8 sm:py-12">
        {/* Back Link */}
        <Link
          href="/browse"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to catalog
        </Link>

        <div className="grid gap-8 lg:grid-cols-3 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Product Card */}
            <div className="lm-card overflow-hidden p-0">
              {/* Image */}
              {product.imageUrl && (
                <div className="relative aspect-[2/1] w-full overflow-hidden bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  {product.isFeatured && (
                    <span className="absolute right-4 top-4 rounded-full bg-warning px-3 py-1.5 text-sm font-semibold text-warning-foreground shadow-lg">
                      Featured Product
                    </span>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="p-6 sm:p-8">
                <div className="flex flex-wrap items-start gap-3">
                  <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl">
                    {product.name}
                  </h1>
                  {product.isFeatured && !product.imageUrl && (
                    <span className="shrink-0 rounded-full bg-warning/15 px-3 py-1 text-sm font-semibold text-warning">
                      Featured
                    </span>
                  )}
                </div>

                {/* Supplier Info */}
                {company && (
                  <Link
                    href={`/companies/${company.id}`}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-card p-3 transition-colors hover:bg-muted"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-lg font-bold text-primary">
                      {company.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {company.name}
                        </span>
                        {company.isVerified && (
                          <BadgeCheck className="h-4 w-4 text-success" />
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        View supplier profile
                      </span>
                    </div>
                  </Link>
                )}

                {/* Description */}
                <p className="mt-6 text-base leading-relaxed text-muted-foreground">
                  {product.description}
                </p>

                {/* Tags */}
                {product.tags.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {product.tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-sm text-muted-foreground"
                      >
                        <Tag className="h-3 w-3" />
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Ship From Region */}
                {product.shipFromRegion && (
                  <div className="mt-6">
                    <Link
                      href={`/browse?region=${encodeURIComponent(product.shipFromRegion)}`}
                      className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      <MapPin className="h-4 w-4" />
                      Ships from {product.shipFromRegion}
                    </Link>
                  </div>
                )}

                {/* Stats Grid */}
                <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="lm-stat">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Package className="h-4 w-4" />
                      Price
                    </div>
                    <div className="mt-2">
                      <ProductUnitPrice
                        variant="stacked"
                        price={product.price}
                        compareAtPrice={product.compareAtPrice}
                        strikeClassName="text-muted-foreground line-through text-sm"
                        saleClassName="text-xl font-bold text-primary"
                      />
                    </div>
                  </div>

                  <div className="lm-stat">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Truck className="h-4 w-4" />
                      Delivery
                    </div>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {product.deliveryTime}
                    </p>
                  </div>

                  <div className="lm-stat">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Star className="h-4 w-4" />
                      Rating
                    </div>
                    <p className="mt-2 text-lg font-semibold text-warning">
                      {productReviews.length > 0
                        ? `${product.averageRating.toFixed(1)} / 5`
                        : "No reviews"}
                    </p>
                    {productReviews.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {productReviews.length} verified
                      </p>
                    )}
                  </div>

                  <div className="lm-stat">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      In Stock
                    </div>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {product.availableQuantity.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">units available</p>
                  </div>
                </div>

                {/* Order Specs */}
                <div className="mt-6 rounded-lg border border-border bg-card/50 p-4">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Clock className="h-4 w-4 text-primary" />
                    Order Specifications
                  </h3>
                  <div className="mt-3">
                    <ProductOrderSpecs
                      size="md"
                      includeStock={false}
                      includeLeadTime={false}
                      product={product}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            {productReviews.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
                    <Shield className="h-5 w-5 text-success" />
                    Verified Reviews
                  </h2>
                  <span className="rounded-full bg-success/10 px-3 py-1 text-sm font-medium text-success">
                    {productReviews.length} reviews
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Reviews from merchants with completed orders
                </p>

                <div className="mt-6 space-y-4">
                  {productReviews.map((r) => {
                    const author = findUserById(r.merchantId);
                    return (
                      <div
                        key={r.id}
                        className="lm-card"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                              {(author?.name ?? "M").charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">
                                {author?.name ?? "Merchant"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(r.createdAt).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < r.rating
                                    ? "fill-warning text-warning"
                                    : "text-muted"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                          {r.comment}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Related Products */}
            <RelatedProducts products={related} />

            {/* Comments */}
            <ProductComments
              productId={product.id}
              canPost={!!canComment}
              currentUserId={user?.id ?? null}
            />
          </div>

          {/* Sidebar - Add to Cart */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <AddToCart
              productId={product.id}
              minQty={product.minOrderQuantity}
              maxQty={product.maxDeliveryQuantity}
              stock={product.availableQuantity}
              defaultQty={defaultQty}
              isMerchant={isMerchant}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
