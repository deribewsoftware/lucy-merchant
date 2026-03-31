import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  ExternalLink,
  FileText,
  Lock,
  MapPin,
  MessageSquareQuote,
  Package,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  Store,
  UserCircle2,
} from "lucide-react";
import { ProductOrderSpecs } from "@/components/product-order-specs";
import { ProductUnitPrice } from "@/components/product-unit-price";
import { PaginationBar, PaginationSummary } from "@/components/ui/pagination-bar";
import { RichTextContent } from "@/components/rich-text-content";
import type { CompanyReviewEligibility } from "@/lib/company-review-eligibility";
import type { Company, Product } from "@/lib/domain/types";
import { isLikelyPdfUrl, isLikelyPublicImageUrl } from "@/lib/utils/document-url";

export type CompanyReviewVm = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  authorName: string;
};

type Props = {
  company: Company;
  /** Paginated slice for the reviews grid. */
  reviews: CompanyReviewVm[];
  /** All reviews — used only for the star distribution bars (accurate histogram). */
  reviewsForDistribution: CompanyReviewVm[];
  reviewsPage: number;
  reviewsPageSize: number;
  reviewsTotal: number;
  reviewsPaginationHref: (p: number) => string;
  products: Product[];
  safePage: number;
  pageSize: number;
  total: number;
  paginationHref: (p: number) => string;
  eligibility: CompanyReviewEligibility;
};

function StarRow({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 sm:h-[1.125rem] sm:w-[1.125rem] ${
            i < rating
              ? "fill-amber-400 text-amber-400"
              : "fill-base-300/40 text-base-300/50"
          }`}
        />
      ))}
    </div>
  );
}

/**
 * Bar length = share of all reviews at that star level (not “tallest bucket”).
 * Clearer than scaling only to the max count.
 */
function RatingDistributionBars({
  counts,
  totalReviews,
}: {
  counts: number[];
  totalReviews: number;
}) {
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" aria-hidden />
          <span className="text-sm font-medium text-foreground">
            Star breakdown
          </span>
        </div>
        <p className="text-xs leading-snug text-muted-foreground">
          Bar width = % of reviews at each level ({totalReviews} total)
        </p>
      </div>
      <ul className="space-y-3" aria-label="Rating distribution by star level">
        {[5, 4, 3, 2, 1].map((star) => {
          const c = counts[star];
          const pct =
            totalReviews > 0 ? Math.round((c / totalReviews) * 1000) / 10 : 0;
          const pctRounded = Math.round(pct);
          return (
            <li key={star} className="flex items-center gap-2 sm:gap-3">
              <span className="flex w-[4.5rem] shrink-0 items-center justify-end gap-0.5 text-sm font-medium tabular-nums text-foreground sm:w-[5.25rem]">
                <span>{star}</span>
                <Star className="h-3.5 w-3.5 fill-amber-400/90 text-amber-500" />
              </span>
              <div className="relative min-h-[0.875rem] min-w-0 flex-1">
                <div
                  className="h-3.5 w-full overflow-hidden rounded-full border border-border/60 bg-gradient-to-b from-base-200/80 to-base-300/50 shadow-inner"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={pctRounded}
                  aria-valuetext={`${pctRounded} percent of reviews are ${star} stars`}
                  aria-label={`${star} stars: ${pctRounded}% of reviews, ${c} reviews`}
                >
                  <div
                    className="h-full min-w-0 rounded-full bg-gradient-to-r from-amber-600/95 via-amber-500 to-amber-400/95 shadow-sm transition-[width] duration-500 ease-out"
                    style={{
                      width: `${Math.min(100, Math.max(0, pct))}%`,
                    }}
                  />
                </div>
              </div>
              <div className="flex w-[4.5rem] shrink-0 flex-col items-end sm:w-[5rem]">
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {pctRounded}%
                </span>
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  {c} {c === 1 ? "review" : "reviews"}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Per-star counts; index 1–5 */
function ratingStarCounts(reviews: CompanyReviewVm[]) {
  const counts = [0, 0, 0, 0, 0, 0];
  for (const r of reviews) {
    const n = Math.min(5, Math.max(1, Math.round(r.rating)));
    counts[n] += 1;
  }
  return counts;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function PublicDocumentPreview({
  label,
  caption,
  value,
}: {
  label: string;
  caption: string;
  value: string;
}) {
  const t = value.trim();
  const isHttp = /^https?:\/\//i.test(t);
  const isUploadPath = t.startsWith("/api/uploads/") || t.startsWith("/uploads/");
  const isLinkLike = isHttp || isUploadPath;
  const showImg = isLinkLike && isLikelyPublicImageUrl(t);
  const showPdf = isLinkLike && isLikelyPdfUrl(t);

  return (
    <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{caption}</p>
        </div>
        {isLinkLike ? (
          <a
            href={t}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/15"
          >
            Open link
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : null}
      </div>
      <div className="mt-3">
        {showImg ? (
          <div className="overflow-hidden rounded-lg border border-border/60 bg-background/80 shadow-inner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={t} alt="" className="max-h-[min(280px,45vh)] w-full object-contain" />
          </div>
        ) : showPdf ? (
          <div className="space-y-2">
            <iframe
              title="PDF preview"
              src={t}
              className="h-[min(320px,55vh)] w-full rounded-lg border border-border/60 bg-muted/30"
            />
            <p className="text-center text-[11px] text-muted-foreground">
              If empty, use <span className="font-medium text-foreground">Open link</span> — some hosts block embedded PDFs.
            </p>
          </div>
        ) : isHttp ? (
          <p className="break-all font-mono text-xs text-muted-foreground">{t}</p>
        ) : (
          <p className="rounded-lg border border-dashed border-border/60 bg-background/60 px-3 py-2 font-mono text-sm text-foreground/80">
            {t}
          </p>
        )}
      </div>
    </div>
  );
}

export function CompanySupplierPublicPage({
  company,
  reviews,
  reviewsForDistribution,
  reviewsPage,
  reviewsPageSize,
  reviewsTotal,
  reviewsPaginationHref,
  products,
  safePage,
  pageSize,
  total,
  paginationHref,
  eligibility,
}: Props) {
  const avg = company.ratingAverage;
  const totalRev = company.totalReviews;
  const starCounts = ratingStarCounts(reviewsForDistribution);
  const distributionTotal = reviewsForDistribution.length;

  const logoOk =
    company.logo && /^https?:\/\//i.test(company.logo.trim())
      ? company.logo.trim()
      : null;

  return (
    <div className="lm-page-wide animate-in fade-in duration-500">
      <nav className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden />
        <Link
          href="/companies"
          className="transition-colors hover:text-foreground"
        >
          Suppliers
        </Link>
        <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden />
        <span className="line-clamp-1 text-foreground">{company.name}</span>
      </nav>

      {/* Hero */}
      <header className="relative mt-6 overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card via-primary/[0.06] to-accent/[0.08] shadow-lg shadow-primary/5">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-12 -left-10 h-44 w-44 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.04)_1px,transparent_1px)] bg-[size:28px_28px]" />

        <div className="relative p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-5 sm:flex-row sm:items-start">
              <div className="relative shrink-0">
                {logoOk ? (
                  <figure className="overflow-hidden rounded-2xl border border-border/60 bg-background/80 shadow-md ring-2 ring-primary/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logoOk}
                      alt=""
                      className="h-24 w-24 object-cover sm:h-28 sm:w-28"
                    />
                  </figure>
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-border/60 bg-gradient-to-br from-primary/20 to-primary/5 shadow-inner sm:h-28 sm:w-28">
                    <Building2 className="h-11 w-11 text-primary sm:h-12 sm:w-12" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
                    <Sparkles className="h-3 w-3" />
                    Supplier profile
                  </span>
                  {company.isVerified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-semibold text-warning">
                      Verification pending
                    </span>
                  )}
                </div>
                <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                  {company.name}
                </h1>
                <div className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  <RichTextContent
                    html={company.description}
                    variant="baseMuted"
                  />
                </div>
              </div>
            </div>

            <div className="flex w-full shrink-0 flex-col gap-3 sm:flex-row lg:w-auto lg:flex-col lg:items-end">
              <div className="grid w-full grid-cols-2 gap-3 sm:max-w-md lg:max-w-xs">
                <div className="rounded-2xl border border-border/50 bg-background/70 p-4 backdrop-blur-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Average rating
                  </p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-bold tabular-nums text-foreground">
                      {totalRev > 0 ? avg.toFixed(1) : "—"}
                    </span>
                    <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {totalRev}{" "}
                    {totalRev === 1 ? "verified review" : "verified reviews"}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/50 bg-background/70 p-4 backdrop-blur-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Listings
                  </p>
                  <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">
                    {total}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Materials in catalog
                  </p>
                </div>
              </div>
              <Link
                href="/browse"
                className="btn btn-outline btn-primary btn-sm sm:btn-md w-full gap-2 sm:w-auto lg:w-full"
              >
                <Store className="h-4 w-4" />
                Back to catalog
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Policy + how reviews work */}
      <section
        className="mt-6 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-6"
        aria-labelledby="reviews-policy-heading"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:justify-between lg:gap-8">
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Lock className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <h2
                  id="reviews-policy-heading"
                  className="font-display text-base font-bold text-foreground sm:text-lg"
                >
                  Who can leave a rating?
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  Only{" "}
                  <strong className="font-semibold text-foreground">
                    merchant buyers
                  </strong>{" "}
                  who have{" "}
                  <strong className="font-semibold text-foreground">
                    completed an order
                  </strong>{" "}
                  that includes materials from this supplier. Casual browsers and
                  accounts with no purchase here cannot submit reviews.
                </p>
              </div>
            </div>

            <ol className="mt-5 grid gap-3 sm:grid-cols-3">
              <li className="flex gap-3 rounded-xl border border-border/50 bg-base-200/30 p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background text-primary ring-1 ring-border/60">
                  <ShoppingCart className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Step 1
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-foreground">
                    Order materials
                  </p>
                </div>
              </li>
              <li className="flex gap-3 rounded-xl border border-border/50 bg-base-200/30 p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background text-primary ring-1 ring-border/60">
                  <ClipboardCheck className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Step 2
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-foreground">
                    Order completes
                  </p>
                </div>
              </li>
              <li className="flex gap-3 rounded-xl border border-border/50 bg-base-200/30 p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background text-primary ring-1 ring-border/60">
                  <Star className="h-4 w-4 fill-amber-400/30 text-amber-600" aria-hidden />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Step 3
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-foreground">
                    Rate from your order
                  </p>
                </div>
              </li>
            </ol>
          </div>

          <ReviewEligibilityPill eligibility={eligibility} />
        </div>
      </section>

      <div className="mt-8 grid gap-8 xl:grid-cols-12 xl:gap-10">
        {/* Left column: location + license */}
        <div className="space-y-6 xl:col-span-5">
          {(company.businessAddress?.trim() ||
            (company.latitude != null &&
              company.longitude != null &&
              Number.isFinite(company.latitude) &&
              Number.isFinite(company.longitude))) && (
            <section className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-2 text-foreground">
                <MapPin className="h-5 w-5 text-primary" />
                <h2 className="font-display text-lg font-bold">Location</h2>
              </div>
              {company.businessAddress?.trim() ? (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
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
                  className="btn btn-outline btn-primary btn-sm mt-4 gap-2"
                >
                  Open in Google Maps
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </section>
          )}

          {company.licenseDocument?.trim() || company.tradeLicenseDocument?.trim() ? (
            <section className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-2 text-foreground">
                <FileText className="h-5 w-5 text-primary" />
                <h2 className="font-display text-lg font-bold">Documents &amp; registration</h2>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                References and files shared by this supplier for transparency. Always verify critical details
                independently when needed.
              </p>
              <div className="mt-4 space-y-3">
                {company.licenseDocument?.trim() ? (
                  <PublicDocumentPreview
                    label="License / certificate"
                    caption="Optional extra registration or certificate the supplier chose to publish."
                    value={company.licenseDocument.trim()}
                  />
                ) : null}
                {company.tradeLicenseDocument?.trim() ? (
                  <PublicDocumentPreview
                    label="Trade license file"
                    caption="Scan or file linked to the supplier’s trade license."
                    value={company.tradeLicenseDocument.trim()}
                  />
                ) : null}
              </div>
            </section>
          ) : null}
        </div>

        {/* Ratings breakdown */}
        <section
          className="xl:col-span-7"
          aria-labelledby="rating-breakdown-heading"
        >
          <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
              <div className="min-w-0 flex-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent">
                  <MessageSquareQuote className="h-3.5 w-3.5" aria-hidden />
                  Ratings snapshot
                </div>
                <h2
                  id="rating-breakdown-heading"
                  className="font-display mt-2 text-xl font-bold text-foreground sm:text-2xl"
                >
                  Buyer satisfaction
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Averages and bars use reviews from{" "}
                  <span className="font-medium text-foreground/90">
                    verified purchases
                  </span>{" "}
                  only.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-4 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 to-transparent px-5 py-4 sm:gap-5">
                <div
                  className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-amber-400/40 bg-base-100 shadow-inner sm:h-24 sm:w-24"
                  aria-hidden
                >
                  <div className="absolute inset-1 rounded-full border border-amber-500/20" />
                  <div className="text-center">
                    <span className="block text-2xl font-bold tabular-nums leading-none text-foreground sm:text-3xl">
                      {totalRev > 0 ? avg.toFixed(1) : "—"}
                    </span>
                    {totalRev > 0 ? (
                      <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        out of 5
                      </span>
                    ) : (
                      <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        no score yet
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <StarRow rating={totalRev > 0 ? Math.round(avg) : 0} />
                  <p className="mt-2 text-xs font-medium text-foreground">
                    Overall score
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {totalRev > 0
                      ? `Based on ${totalRev} verified ${totalRev === 1 ? "review" : "reviews"}`
                      : "No reviews yet"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-border/40 pt-6">
              {distributionTotal > 0 ? (
                <RatingDistributionBars
                  counts={starCounts}
                  totalReviews={distributionTotal}
                />
              ) : (
                <div className="rounded-xl border border-dashed border-border/70 bg-base-200/25 px-4 py-8 text-center">
                  <BarChart3 className="mx-auto h-8 w-8 text-muted-foreground/50" />
                  <p className="mt-2 text-sm font-medium text-foreground">
                    No distribution yet
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Star breakdown appears once buyers submit ratings.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Reviews list */}
      <section id="company-reviews" className="mt-10 scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Reviews from verified buyers
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Each review is tied to a completed order for materials from this
              supplier—so feedback reflects real purchase experience.
            </p>
          </div>
        </div>

        {reviewsTotal > 0 && (
          <PaginationSummary
            page={reviewsPage}
            pageSize={reviewsPageSize}
            total={reviewsTotal}
            className="mt-4 text-sm text-muted-foreground"
          />
        )}

        {reviewsTotal === 0 ? (
          <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-base-200/30 px-6 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <MessageSquareQuote className="h-7 w-7 opacity-80" />
            </div>
            <p className="mt-4 text-base font-semibold text-foreground">
              No reviews yet
            </p>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              When merchants complete orders, they can leave a rating here.
              Public visitors cannot post reviews.
            </p>
          </div>
        ) : (
          <>
            <ul className="mt-6 grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
              {reviews.map((r, idx) => (
                <li
                  key={r.id}
                  className="animate-in fade-in rounded-2xl border border-border/50 bg-card p-5 shadow-sm duration-300"
                  style={{ animationDelay: `${Math.min(idx, 8) * 40}ms` }}
                >
                  <div className="flex gap-4">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/15 text-sm font-bold text-primary"
                      aria-hidden
                    >
                      {initials(r.authorName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {r.authorName}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success">
                          <CheckCircle2 className="h-3 w-3" />
                          Verified buyer
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <StarRow rating={r.rating} />
                        <time
                          className="text-xs text-muted-foreground"
                          dateTime={r.createdAt}
                        >
                          {new Date(r.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </time>
                      </div>
                      <div className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        <RichTextContent
                          html={r.comment}
                          variant="baseMuted"
                          className="text-muted-foreground"
                        />
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <PaginationBar
              page={reviewsPage}
              pageSize={reviewsPageSize}
              total={reviewsTotal}
              buildHref={reviewsPaginationHref}
              className="mt-6"
            />
          </>
        )}
      </section>

      {/* Listings */}
      <section id="listings" className="mt-14 scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Materials & listings
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              MOQs, delivery windows, and unit pricing—confirm before you order.
            </p>
          </div>
          {total > 0 && (
            <PaginationSummary
              page={safePage}
              pageSize={pageSize}
              total={total}
              className="text-sm text-muted-foreground"
            />
          )}
        </div>

        <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.length === 0 && (
            <li className="col-span-full rounded-2xl border border-dashed border-border/70 bg-base-200/25 px-6 py-12 text-center text-sm text-muted-foreground">
              No published products yet.
            </li>
          )}
          {products.map((p, index) => (
            <li
              key={p.id}
              className="animate-in fade-in"
              style={{ animationDelay: `${Math.min(index, 10) * 35}ms` }}
            >
              <Link
                href={`/products/${p.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm transition-all duration-300 hover:border-primary/35 hover:shadow-lg hover:shadow-primary/5"
              >
                {p.imageUrl ? (
                  <figure className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.imageUrl}
                      alt=""
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                    {p.isFeatured ? (
                      <span className="badge badge-warning absolute end-2 top-2 text-[10px] uppercase">
                        Featured
                      </span>
                    ) : null}
                  </figure>
                ) : (
                  <div className="flex aspect-[16/10] w-full items-center justify-center bg-gradient-to-br from-base-200/80 to-base-300/40">
                    <Package className="h-12 w-12 text-muted-foreground/40" />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground group-hover:text-primary">
                      {p.name}
                    </h3>
                    {p.isFeatured && !p.imageUrl ? (
                      <span className="badge badge-warning badge-sm shrink-0 uppercase">
                        Featured
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-col gap-2 text-sm">
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
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition group-hover:opacity-100">
                    View listing
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <PaginationBar
          page={safePage}
          pageSize={pageSize}
          total={total}
          buildHref={paginationHref}
        />
      </section>
    </div>
  );
}

function ReviewEligibilityPill({
  eligibility,
}: {
  eligibility: CompanyReviewEligibility;
}) {
  const shell =
    "w-full rounded-2xl border p-4 sm:w-[min(100%,20rem)] lg:shrink-0 lg:self-start";

  if (eligibility.kind === "guest") {
    return (
      <div className={`${shell} border-border/60 bg-base-200/40`}>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <UserCircle2 className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Your account
            </p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">
              Signed out
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Sign in as a merchant to order materials; reviews unlock after a
              completed purchase.
            </p>
            <Link href="/login" className="btn btn-primary btn-sm mt-3 w-full gap-1 sm:w-auto">
              Sign in to buy &amp; review
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }
  if (eligibility.kind === "not_merchant") {
    return (
      <div className={`${shell} border-border/60 bg-base-200/40`}>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
            <Building2 className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Your account
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Supplier profiles are rated by{" "}
              <strong className="font-medium text-foreground">
                merchant buyers
              </strong>{" "}
              after a completed order. This review form is not available for
              supplier accounts on this page.
            </p>
          </div>
        </div>
      </div>
    );
  }
  if (!eligibility.hasCompletedPurchase) {
    return (
      <div className={`${shell} border-warning/25 bg-warning/5`}>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning">
            <ShoppingCart className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Your eligibility
            </p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">
              No completed order with this supplier
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              After your order is completed, you can rate this company from your
              order details.
            </p>
            <a
              href="#listings"
              className="btn btn-outline btn-sm mt-3 w-full border-primary/30 sm:w-auto"
            >
              Jump to listings
            </a>
          </div>
        </div>
      </div>
    );
  }
  if (eligibility.pendingReviewOrderId) {
    return (
      <div className={`${shell} border-success/30 bg-success/5`}>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/15 text-success">
            <Star className="h-5 w-5 fill-amber-400/40 text-amber-700" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Your eligibility
            </p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">
              You can submit a review
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Open your completed order and rate this supplier (one review per
              order).
            </p>
            <Link
              href={`/merchant/orders/${eligibility.pendingReviewOrderId}`}
              className="btn btn-success btn-sm mt-3 w-full gap-1 text-success-content sm:w-auto"
            >
              Open order &amp; rate
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={`${shell} border-border/60 bg-base-200/40`}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <CheckCircle2 className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Your eligibility
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            You have already submitted reviews for your completed orders with
            this supplier.
          </p>
        </div>
      </div>
    </div>
  );
}
