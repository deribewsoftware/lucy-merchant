import { randomUUID } from "crypto";
import type { CompanyReview } from "@/lib/domain/types";
import { setCompanyReviewStats } from "@/lib/db/catalog";
import { readJsonFile, writeJsonFile } from "@/lib/store/json-file";

const FILE = "company-reviews.json";

function load(): CompanyReview[] {
  return readJsonFile<CompanyReview[]>(FILE, []);
}

function save(rows: CompanyReview[]) {
  writeJsonFile(FILE, rows);
}

export function listReviewsForCompany(companyId: string): CompanyReview[] {
  return load().filter((r) => r.companyId === companyId);
}

export function listAllCompanyReviews(): CompanyReview[] {
  return load().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getCompanyReviewById(reviewId: string): CompanyReview | undefined {
  return load().find((r) => r.id === reviewId);
}

export function deleteCompanyReviewById(reviewId: string): boolean {
  const rows = load();
  const hit = rows.find((r) => r.id === reviewId);
  if (!hit) return false;
  const next = rows.filter((r) => r.id !== reviewId);
  save(next);
  syncCompanyAggregate(hit.companyId);
  return true;
}

export function hasReviewForOrderCompany(
  orderId: string,
  companyId: string,
  merchantId: string,
): boolean {
  return load().some(
    (r) =>
      r.orderId === orderId &&
      r.companyId === companyId &&
      r.merchantId === merchantId,
  );
}

function syncCompanyAggregate(companyId: string): void {
  const list = listReviewsForCompany(companyId);
  const n = list.length;
  const avg = n ? list.reduce((s, r) => s + r.rating, 0) / n : 0;
  setCompanyReviewStats(companyId, avg, n);
}

export function createCompanyReview(input: {
  companyId: string;
  merchantId: string;
  orderId: string;
  rating: number;
  comment: string;
}): CompanyReview {
  const rating = Math.min(5, Math.max(1, Math.round(input.rating)));
  const comment = input.comment.trim();
  if (!comment) {
    throw new Error("Comment is required");
  }
  if (
    hasReviewForOrderCompany(
      input.orderId,
      input.companyId,
      input.merchantId,
    )
  ) {
    throw new Error("You already reviewed this company for this order");
  }
  const rows = load();
  const review: CompanyReview = {
    id: randomUUID(),
    companyId: input.companyId,
    merchantId: input.merchantId,
    orderId: input.orderId,
    rating,
    comment,
    createdAt: new Date().toISOString(),
  };
  rows.push(review);
  save(rows);
  syncCompanyAggregate(input.companyId);
  return review;
}
