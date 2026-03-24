import Link from "next/link";
import {
  HiOutlineBuildingStorefront,
  HiOutlineChatBubbleLeftRight,
  HiOutlineShieldCheck,
  HiOutlineStar,
} from "react-icons/hi2";
import { ModerationDeleteButton } from "@/components/moderation-delete-button";
import { getCompany, getProduct } from "@/lib/db/catalog";
import { listAllProductComments } from "@/lib/db/comments";
import { listAllProductReviews } from "@/lib/db/product-reviews";
import { listAllCompanyReviews } from "@/lib/db/reviews";
import { findUserById } from "@/lib/db/users";

export default function AdminModerationPage() {
  const comments = listAllProductComments().slice().reverse();
  const companyReviews = listAllCompanyReviews().slice().reverse();
  const productReviews = listAllProductReviews().slice().reverse();

  return (
    <div className="space-y-12">
      <header className="flex flex-col gap-4 border-b border-base-300 pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-error/10 text-error">
            <HiOutlineShieldCheck className="h-7 w-7" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-base-content">
              Moderation
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-base-content/60">
              Remove harmful or policy-breaking UGC. Deleting reviews and
              comments updates aggregates where the data layer supports it.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-base-200 px-3 py-1 text-xs font-medium text-base-content/70">
            <HiOutlineChatBubbleLeftRight className="h-3.5 w-3.5" />
            {comments.length} comments
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-base-200 px-3 py-1 text-xs font-medium text-base-content/70">
            <HiOutlineBuildingStorefront className="h-3.5 w-3.5" />
            {companyReviews.length} company
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-base-200 px-3 py-1 text-xs font-medium text-base-content/70">
            <HiOutlineStar className="h-3.5 w-3.5" />
            {productReviews.length} product
          </span>
        </div>
      </header>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-base-content">
          <HiOutlineChatBubbleLeftRight className="h-5 w-5 text-primary" />
          Product comments
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {comments.length}
          </span>
        </h2>
        <ul className="space-y-3">
          {comments.map((c) => {
            const p = getProduct(c.productId);
            return (
              <li
                key={c.id}
                className="flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm ring-1 ring-base-300/15 sm:flex-row sm:items-start sm:justify-between sm:p-5"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-base-content">
                    {c.userName}{" "}
                    <span className="font-normal text-base-content/50">
                      on {p?.name ?? c.productId}
                    </span>
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-base-content/70">
                    {c.comment}
                  </p>
                  <Link
                    href={`/products/${c.productId}`}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    View product →
                  </Link>
                </div>
                <ModerationDeleteButton
                  apiPath={`/api/admin/moderation/product-comment/${c.id}`}
                />
              </li>
            );
          })}
        </ul>
        {comments.length === 0 && (
          <p className="rounded-2xl border border-dashed border-base-300 bg-base-200/20 px-4 py-10 text-center text-sm text-base-content/55">
            No comments to review.
          </p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-base-content">
          <HiOutlineBuildingStorefront className="h-5 w-5 text-secondary" />
          Company reviews
          <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-xs font-medium text-secondary">
            {companyReviews.length}
          </span>
        </h2>
        <ul className="space-y-3">
          {companyReviews.map((r) => {
            const co = getCompany(r.companyId);
            const author = findUserById(r.merchantId);
            return (
              <li
                key={r.id}
                className="flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm ring-1 ring-base-300/15 sm:flex-row sm:items-start sm:justify-between sm:p-5"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-base-content">
                    <span className="text-warning">{r.rating}★</span> ·{" "}
                    {co?.name ?? r.companyId}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-base-content/70">
                    <span className="font-medium text-base-content/80">
                      {author?.name ?? r.merchantId}:
                    </span>{" "}
                    {r.comment}
                  </p>
                </div>
                <ModerationDeleteButton
                  apiPath={`/api/admin/moderation/company-review/${r.id}`}
                />
              </li>
            );
          })}
        </ul>
        {companyReviews.length === 0 && (
          <p className="rounded-2xl border border-dashed border-base-300 bg-base-200/20 px-4 py-10 text-center text-sm text-base-content/55">
            No company reviews.
          </p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-base-content">
          <HiOutlineStar className="h-5 w-5 text-accent" />
          Product reviews
          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
            {productReviews.length}
          </span>
        </h2>
        <ul className="space-y-3">
          {productReviews.map((r) => {
            const p = getProduct(r.productId);
            const author = findUserById(r.merchantId);
            return (
              <li
                key={r.id}
                className="flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm ring-1 ring-base-300/15 sm:flex-row sm:items-start sm:justify-between sm:p-5"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-base-content">
                    <span className="text-warning">{r.rating}★</span> ·{" "}
                    {p?.name ?? r.productId}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-base-content/70">
                    <span className="font-medium text-base-content/80">
                      {author?.name ?? r.merchantId}:
                    </span>{" "}
                    {r.comment}
                  </p>
                </div>
                <ModerationDeleteButton
                  apiPath={`/api/admin/moderation/product-review/${r.id}`}
                />
              </li>
            );
          })}
        </ul>
        {productReviews.length === 0 && (
          <p className="rounded-2xl border border-dashed border-base-300 bg-base-200/20 px-4 py-10 text-center text-sm text-base-content/55">
            No product reviews.
          </p>
        )}
      </section>
    </div>
  );
}
