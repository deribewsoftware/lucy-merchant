import { randomUUID } from "crypto";
import type { ProductReview } from "@/lib/domain/types";
import { setProductRatingStats } from "@/lib/db/catalog";
import { readJsonFile, writeJsonFile } from "@/lib/store/json-file";

const FILE = "product-reviews.json";

function load(): ProductReview[] {
  return readJsonFile<ProductReview[]>(FILE, []);
}

function save(rows: ProductReview[]) {
  writeJsonFile(FILE, rows);
}

export function listReviewsForProduct(productId: string): ProductReview[] {
  return load()
    .filter((r) => r.productId === productId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function listAllProductReviews(): ProductReview[] {
  return load().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function deleteReviewsForProduct(productId: string): void {
  const rows = load();
  save(rows.filter((r) => r.productId !== productId));
}

export function getProductReviewById(reviewId: string): ProductReview | undefined {
  return load().find((r) => r.id === reviewId);
}

export function deleteProductReviewById(reviewId: string): boolean {
  const rows = load();
  const hit = rows.find((r) => r.id === reviewId);
  if (!hit) return false;
  const next = rows.filter((r) => r.id !== reviewId);
  save(next);
  syncProductAggregate(hit.productId);
  return true;
}

export function hasReviewForOrderProduct(
  orderId: string,
  productId: string,
  merchantId: string,
): boolean {
  return load().some(
    (r) =>
      r.orderId === orderId &&
      r.productId === productId &&
      r.merchantId === merchantId,
  );
}

function syncProductAggregate(productId: string): void {
  const list = listReviewsForProduct(productId);
  const n = list.length;
  const avg = n ? list.reduce((s, r) => s + r.rating, 0) / n : 0;
  setProductRatingStats(productId, n ? avg : 0);
}

export function createProductReview(input: {
  productId: string;
  merchantId: string;
  orderId: string;
  rating: number;
  comment: string;
}): ProductReview {
  const rating = Math.min(5, Math.max(1, Math.round(input.rating)));
  const comment = input.comment.trim();
  if (!comment) {
    throw new Error("Comment is required");
  }
  if (
    hasReviewForOrderProduct(
      input.orderId,
      input.productId,
      input.merchantId,
    )
  ) {
    throw new Error("You already reviewed this product for this order");
  }
  const rows = load();
  const review: ProductReview = {
    id: randomUUID(),
    productId: input.productId,
    merchantId: input.merchantId,
    orderId: input.orderId,
    rating,
    comment,
    createdAt: new Date().toISOString(),
  };
  rows.push(review);
  save(rows);
  syncProductAggregate(input.productId);
  return review;
}
