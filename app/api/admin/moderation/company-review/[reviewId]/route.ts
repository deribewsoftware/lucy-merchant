import { NextResponse } from "next/server";
import { ADMIN_STAFF_ROLES } from "@/lib/admin-staff";
import { notifyMerchantCompanyReviewRemovedByModeration } from "@/lib/db/notifications";
import {
  deleteCompanyReviewById,
  getCompanyReviewById,
} from "@/lib/db/reviews";
import { logStaffAction } from "@/lib/server/admin-audit-log";
import { requireStaffPermission } from "@/lib/server/admin-permissions";
import { requireSession } from "@/lib/server/require-session";

type Params = { params: Promise<{ reviewId: string }> };

export async function DELETE(request: Request, context: Params) {
  const auth = await requireSession(ADMIN_STAFF_ROLES);
  if (!auth.ok) return auth.response;
  const perm = requireStaffPermission(auth.user.id, "moderation:manage");
  if (!perm.ok) return perm.response;

  const { reviewId } = await context.params;
  const before = getCompanyReviewById(reviewId);
  const ok = deleteCompanyReviewById(reviewId);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (before) {
    notifyMerchantCompanyReviewRemovedByModeration(before);
  }
  logStaffAction(request, {
    actorId: auth.user.id,
    action: "moderation.delete_company_review",
    resource: reviewId,
  });
  return NextResponse.json({ ok: true });
}
