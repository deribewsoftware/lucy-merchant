import { NextResponse } from "next/server";
import { ADMIN_STAFF_ROLES } from "@/lib/admin-staff";
import {
  deleteProductCommentById,
  getProductCommentById,
} from "@/lib/db/comments";
import { notifyUserProductCommentRemovedByModeration } from "@/lib/db/notifications";
import { logStaffAction } from "@/lib/server/admin-audit-log";
import { requireStaffPermission } from "@/lib/server/admin-permissions";
import { requireSession } from "@/lib/server/require-session";

type Params = { params: Promise<{ commentId: string }> };

export async function DELETE(request: Request, context: Params) {
  const auth = await requireSession(ADMIN_STAFF_ROLES);
  if (!auth.ok) return auth.response;
  const perm = requireStaffPermission(auth.user.id, "moderation:manage");
  if (!perm.ok) return perm.response;

  const { commentId } = await context.params;
  const before = getProductCommentById(commentId);
  const ok = deleteProductCommentById(commentId);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (before) {
    notifyUserProductCommentRemovedByModeration(before);
  }
  logStaffAction(request, {
    actorId: auth.user.id,
    action: "moderation.delete_product_comment",
    resource: commentId,
  });
  return NextResponse.json({ ok: true });
}
