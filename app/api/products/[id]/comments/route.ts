import { NextResponse } from "next/server";
import { getCompany, getProduct } from "@/lib/db/catalog";
import {
  addProductComment,
  getProductCommentById,
  listCommentsForProduct,
} from "@/lib/db/comments";
import {
  notifySupplierProductCommentPosted,
  notifyUserProductCommentReplied,
} from "@/lib/db/notifications";
import { requireSession } from "@/lib/server/require-session";
import { checkRateLimit } from "@/lib/server/rate-limit";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Params) {
  const { id } = await context.params;
  if (!getProduct(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ comments: listCommentsForProduct(id) });
}

export async function POST(request: Request, context: Params) {
  const auth = await requireSession(["merchant", "supplier", "admin"]);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  if (!getProduct(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const rl = checkRateLimit(`pcom:${auth.user.id}`, 40, 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Slow down. Retry in ${rl.retryAfterSec}s` },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const comment = String(body?.comment ?? "");
  const parentId =
    body?.parentId === null || body?.parentId === undefined || body?.parentId === ""
      ? null
      : String(body.parentId);

  try {
    const row = addProductComment({
      productId: id,
      userId: auth.user.id,
      userName: auth.user.name,
      comment,
      parentId,
    });
    const product = getProduct(id);
    const co = product ? getCompany(product.companyId) : undefined;
    if (!parentId) {
      notifySupplierProductCommentPosted({
        productId: id,
        authorUserId: auth.user.id,
        preview: row.comment,
      });
    } else {
      const parent = getProductCommentById(parentId);
      if (parent && parent.userId !== auth.user.id) {
        notifyUserProductCommentReplied({
          productId: id,
          parentAuthorUserId: parent.userId,
          replierUserId: auth.user.id,
          preview: row.comment,
        });
      }
      if (
        co &&
        co.ownerId !== auth.user.id &&
        (!parent || co.ownerId !== parent.userId)
      ) {
        notifySupplierProductCommentPosted({
          productId: id,
          authorUserId: auth.user.id,
          preview: row.comment,
        });
      }
    }
    return NextResponse.json({ comment: row });
  } catch (e) {
    const m = e instanceof Error ? e.message : "Failed to post";
    return NextResponse.json({ error: m }, { status: 400 });
  }
}
