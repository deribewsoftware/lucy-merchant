import { NextResponse } from "next/server";
import { notifyMerchantCompanyReviewRemovedByModeration } from "@/lib/db/notifications";
import {
  deleteCompanyReviewById,
  getCompanyReviewById,
} from "@/lib/db/reviews";
import { requireSession } from "@/lib/server/require-session";

type Params = { params: Promise<{ reviewId: string }> };

export async function DELETE(_request: Request, context: Params) {
  const auth = await requireSession(["admin"]);
  if (!auth.ok) return auth.response;

  const { reviewId } = await context.params;
  const before = getCompanyReviewById(reviewId);
  const ok = deleteCompanyReviewById(reviewId);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (before) {
    notifyMerchantCompanyReviewRemovedByModeration(before);
  }
  return NextResponse.json({ ok: true });
}
