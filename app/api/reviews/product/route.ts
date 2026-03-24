import { NextResponse } from "next/server";
import { getOrder } from "@/lib/db/commerce";
import { notifyProductReviewPosted } from "@/lib/db/notifications";
import { createProductReview } from "@/lib/db/product-reviews";
import { requireSession } from "@/lib/server/require-session";
import { checkRateLimit } from "@/lib/server/rate-limit";

export async function POST(request: Request) {
  const auth = await requireSession(["merchant"]);
  if (!auth.ok) return auth.response;

  const rl = checkRateLimit(`revprod:${auth.user.id}`, 20, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many reviews. Retry in ${rl.retryAfterSec}s` },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const orderId = String(body?.orderId ?? "");
  const productId = String(body?.productId ?? "");
  const rating = Number(body?.rating);
  const comment = String(body?.comment ?? "");

  if (!orderId || !productId) {
    return NextResponse.json(
      { error: "orderId and productId required" },
      { status: 400 },
    );
  }

  const order = getOrder(orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.merchantId !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (order.status !== "completed") {
    return NextResponse.json(
      { error: "You can only review after the order is completed" },
      { status: 400 },
    );
  }
  const touches = order.items.some((i) => i.productId === productId);
  if (!touches) {
    return NextResponse.json(
      { error: "This product is not part of the order" },
      { status: 400 },
    );
  }

  try {
    const review = createProductReview({
      productId,
      merchantId: auth.user.id,
      orderId,
      rating,
      comment,
    });
    notifyProductReviewPosted(productId, review.rating, review.comment);
    return NextResponse.json({ review });
  } catch (e) {
    const m = e instanceof Error ? e.message : "Failed to save review";
    return NextResponse.json({ error: m }, { status: 400 });
  }
}
