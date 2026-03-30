import { NextResponse } from "next/server";
import {
  deleteProductReviewById,
  getProductReviewById,
} from "@/lib/db/product-reviews";
import { notifyMerchantProductReviewRemovedByModeration } from "@/lib/db/notifications";
import { requireSession } from "@/lib/server/require-session";

type Params = { params: Promise<{ reviewId: string }> };

export async function DELETE(_request: Request, context: Params) {
  const auth = await requireSession(["admin"]);
  if (!auth.ok) return auth.response;

  const { reviewId } = await context.params;
  const before = getProductReviewById(reviewId);
  const ok = deleteProductReviewById(reviewId);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (before) {
    notifyMerchantProductReviewRemovedByModeration(before);
  }
  return NextResponse.json({ ok: true });
}
