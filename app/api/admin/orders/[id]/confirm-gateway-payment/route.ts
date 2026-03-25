import { NextResponse } from "next/server";
import { getOrder } from "@/lib/db/commerce";
import { activatePaidOrder } from "@/lib/payments/order-activation";
import { requireSession } from "@/lib/server/require-session";

type Params = { params: Promise<{ id: string }> };

/**
 * After Stripe/Chapa reports success, admin confirms so the order becomes paid
 * and suppliers are notified (merchant sees “Paid” only after this step).
 */
export async function POST(_request: Request, context: Params) {
  const auth = await requireSession(["admin"]);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const order = getOrder(id);
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (order.status !== "awaiting_payment") {
    return NextResponse.json(
      { error: "Order is not waiting for payment confirmation" },
      { status: 400 },
    );
  }
  if (!order.gatewayPaymentCapturedAt) {
    return NextResponse.json(
      { error: "No gateway capture recorded for this order" },
      { status: 400 },
    );
  }
  if (order.paymentMethod !== "stripe" && order.paymentMethod !== "chapa") {
    return NextResponse.json(
      { error: "This action applies to card / Chapa checkouts only" },
      { status: 400 },
    );
  }
  if (order.paymentStatus === "paid") {
    return NextResponse.json({ error: "Already paid" }, { status: 400 });
  }

  const updated = activatePaidOrder(id, "platform-confirmed");
  if (!updated) {
    return NextResponse.json({ error: "Could not confirm" }, { status: 400 });
  }
  return NextResponse.json({ order: updated });
}
