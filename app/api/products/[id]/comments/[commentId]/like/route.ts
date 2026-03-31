import { NextResponse } from "next/server";
import { getProduct } from "@/lib/db/catalog";
import { listAllProductComments, toggleCommentLike } from "@/lib/db/comments";
import { MERCHANT_SUPPLIER_STAFF_ROLES } from "@/lib/admin-staff";
import { requireSession } from "@/lib/server/require-session";
import { checkRateLimit } from "@/lib/server/rate-limit";

type Params = {
  params: Promise<{ id: string; commentId: string }>;
};

export async function POST(_request: Request, context: Params) {
  const auth = await requireSession(MERCHANT_SUPPLIER_STAFF_ROLES);
  if (!auth.ok) return auth.response;

  const { id: productId, commentId } = await context.params;
  if (!getProduct(productId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const rl = checkRateLimit(`plike:${auth.user.id}`, 120, 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Slow down. Retry in ${rl.retryAfterSec}s` },
      { status: 429 },
    );
  }

  const row = listAllProductComments().find((c) => c.id === commentId);
  if (!row || row.productId !== productId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const updated = toggleCommentLike(commentId, auth.user.id);
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ comment: updated });
}
