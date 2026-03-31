"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  HiOutlineBuildingStorefront,
  HiOutlineChatBubbleLeftRight,
  HiOutlineStar,
} from "react-icons/hi2";
import { ModerationDeleteButton } from "@/components/moderation-delete-button";
import { RichTextContent } from "@/components/rich-text-content";
import { PaginationBar, PaginationSummary } from "@/components/ui/pagination-bar";
import { clampPage, pageStartIndex } from "@/lib/utils/pagination";

const PAGE_SIZE = 12;

export type ModerationCommentVm = {
  id: string;
  productId: string;
  productName: string;
  userName: string;
  commentHtml: string;
};

export type ModerationCompanyReviewVm = {
  id: string;
  rating: number;
  comment: string;
  companyName: string;
  authorName: string;
};

export type ModerationProductReviewVm = {
  id: string;
  rating: number;
  comment: string;
  productName: string;
  authorName: string;
};

export function AdminModerationLists({
  comments,
  companyReviews,
  productReviews,
}: {
  comments: ModerationCommentVm[];
  companyReviews: ModerationCompanyReviewVm[];
  productReviews: ModerationProductReviewVm[];
}) {
  const [cPage, setCPage] = useState(1);
  const [crPage, setCrPage] = useState(1);
  const [prPage, setPrPage] = useState(1);

  useEffect(() => {
    setCPage(1);
  }, [comments.length]);
  useEffect(() => {
    setCrPage(1);
  }, [companyReviews.length]);
  useEffect(() => {
    setPrPage(1);
  }, [productReviews.length]);

  const cTotal = comments.length;
  const cSafe = clampPage(cPage, cTotal, PAGE_SIZE);
  const cStart = pageStartIndex(cSafe, cTotal, PAGE_SIZE);
  const commentsPage = comments.slice(cStart, cStart + PAGE_SIZE);

  const crTotal = companyReviews.length;
  const crSafe = clampPage(crPage, crTotal, PAGE_SIZE);
  const crStart = pageStartIndex(crSafe, crTotal, PAGE_SIZE);
  const companyReviewsPage = companyReviews.slice(crStart, crStart + PAGE_SIZE);

  const prTotal = productReviews.length;
  const prSafe = clampPage(prPage, prTotal, PAGE_SIZE);
  const prStart = pageStartIndex(prSafe, prTotal, PAGE_SIZE);
  const productReviewsPage = productReviews.slice(prStart, prStart + PAGE_SIZE);

  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-base-content">
          <HiOutlineChatBubbleLeftRight className="h-5 w-5 text-primary" />
          Product comments
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {comments.length}
          </span>
        </h2>
        {cTotal > 0 && (
          <PaginationSummary
            page={cSafe}
            pageSize={PAGE_SIZE}
            total={cTotal}
            className="text-base-content/60"
          />
        )}
        <ul className="space-y-3">
          {commentsPage.map((c) => (
            <li
              key={c.id}
              className="flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm ring-1 ring-base-300/15 sm:flex-row sm:items-start sm:justify-between sm:p-5"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-base-content">
                  {c.userName}{" "}
                  <span className="font-normal text-base-content/50">
                    on {c.productName}
                  </span>
                </p>
                <div className="mt-2 text-sm leading-relaxed text-base-content/70">
                  <RichTextContent html={c.commentHtml} variant="compact" />
                </div>
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
          ))}
        </ul>
        {comments.length === 0 && (
          <p className="rounded-2xl border border-dashed border-base-300 bg-base-200/20 px-4 py-10 text-center text-sm text-base-content/55">
            No comments to review.
          </p>
        )}
        <PaginationBar
          page={cSafe}
          pageSize={PAGE_SIZE}
          total={cTotal}
          onPageChange={setCPage}
          className="mt-4"
        />
      </section>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-base-content">
          <HiOutlineBuildingStorefront className="h-5 w-5 text-secondary" />
          Company reviews
          <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-xs font-medium text-secondary">
            {companyReviews.length}
          </span>
        </h2>
        {crTotal > 0 && (
          <PaginationSummary
            page={crSafe}
            pageSize={PAGE_SIZE}
            total={crTotal}
            className="text-base-content/60"
          />
        )}
        <ul className="space-y-3">
          {companyReviewsPage.map((r) => (
            <li
              key={r.id}
              className="flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm ring-1 ring-base-300/15 sm:flex-row sm:items-start sm:justify-between sm:p-5"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-base-content">
                  <span className="text-warning">{r.rating}★</span> · {r.companyName}
                </p>
                <div className="mt-2 text-sm leading-relaxed text-base-content/70">
                  <span className="font-medium text-base-content/80">{r.authorName}:</span>
                  <RichTextContent
                    html={r.comment}
                    variant="compact"
                    className="mt-1"
                  />
                </div>
              </div>
              <ModerationDeleteButton
                apiPath={`/api/admin/moderation/company-review/${r.id}`}
              />
            </li>
          ))}
        </ul>
        {companyReviews.length === 0 && (
          <p className="rounded-2xl border border-dashed border-base-300 bg-base-200/20 px-4 py-10 text-center text-sm text-base-content/55">
            No company reviews.
          </p>
        )}
        <PaginationBar
          page={crSafe}
          pageSize={PAGE_SIZE}
          total={crTotal}
          onPageChange={setCrPage}
          className="mt-4"
        />
      </section>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-base-content">
          <HiOutlineStar className="h-5 w-5 text-accent" />
          Product reviews
          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
            {productReviews.length}
          </span>
        </h2>
        {prTotal > 0 && (
          <PaginationSummary
            page={prSafe}
            pageSize={PAGE_SIZE}
            total={prTotal}
            className="text-base-content/60"
          />
        )}
        <ul className="space-y-3">
          {productReviewsPage.map((r) => (
            <li
              key={r.id}
              className="flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm ring-1 ring-base-300/15 sm:flex-row sm:items-start sm:justify-between sm:p-5"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-base-content">
                  <span className="text-warning">{r.rating}★</span> · {r.productName}
                </p>
                <div className="mt-2 text-sm leading-relaxed text-base-content/70">
                  <span className="font-medium text-base-content/80">{r.authorName}:</span>
                  <RichTextContent
                    html={r.comment}
                    variant="compact"
                    className="mt-1"
                  />
                </div>
              </div>
              <ModerationDeleteButton
                apiPath={`/api/admin/moderation/product-review/${r.id}`}
              />
            </li>
          ))}
        </ul>
        {productReviews.length === 0 && (
          <p className="rounded-2xl border border-dashed border-base-300 bg-base-200/20 px-4 py-10 text-center text-sm text-base-content/55">
            No product reviews.
          </p>
        )}
        <PaginationBar
          page={prSafe}
          pageSize={PAGE_SIZE}
          total={prTotal}
          onPageChange={setPrPage}
          className="mt-4"
        />
      </section>
    </div>
  );
}
