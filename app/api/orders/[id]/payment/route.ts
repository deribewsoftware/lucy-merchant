import { NextResponse } from "next/server";
import { getOrder, updateOrderPaymentStatus } from "@/lib/db/commerce";
import { markPendingPaymentPaid } from "@/lib/db/payments";
import { requireSession } from "@/lib/server/require-session";
import { canAccessOrder } from "@/lib/server/order-access";

type Params = { params: Promise<{ id: string }> };

/** Supplier or admin confirms payment received (COD / bank) — PDF payment flow. */
export async function POST(request: Request, context: Params) {
  const auth = await requireSession(["supplier", "admin"]);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const order = getOrder(id);
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!canAccessOrder(auth.user, order)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (order.paymentStatus === "paid") {
    return NextResponse.json(
      { error: "Payment already marked as paid" },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => null);
  const transactionRef =
    typeof body?.transactionRef === "string" ? body.transactionRef : undefined;

  const payment = markPendingPaymentPaid(id, transactionRef);
  if (!payment) {
    return NextResponse.json(
      { error: "No pending payment record for this order" },
      { status: 400 },
    );
  }

  const updated = updateOrderPaymentStatus(id, "paid");
  return NextResponse.json({ payment, order: updated });
}
