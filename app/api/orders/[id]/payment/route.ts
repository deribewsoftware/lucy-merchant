import { NextResponse } from "next/server";
import { getOrder } from "@/lib/db/commerce";
import { listPaymentsForOrder } from "@/lib/db/payments";
import { isSingleSupplierOrder } from "@/lib/domain/order-split";
import { activatePaidOrder } from "@/lib/payments/order-activation";
import { requireSession } from "@/lib/server/require-session";
import { canAccessOrder } from "@/lib/server/order-access";

type Params = { params: Promise<{ id: string }> };

/** Supplier or admin confirms payment received (COD, Telebirr manual, etc.). */
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

  if (auth.user.role === "supplier" && !isSingleSupplierOrder(order)) {
    return NextResponse.json(
      {
        error:
          "This order mixes multiple suppliers. Only an admin can confirm payment for legacy orders.",
      },
      { status: 400 },
    );
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

  const updated = activatePaidOrder(id, transactionRef);
  if (!updated) {
    return NextResponse.json(
      { error: "Could not confirm payment" },
      { status: 400 },
    );
  }

  const payments = listPaymentsForOrder(id);
  const payment =
    payments.find((p) => p.status === "paid") ?? payments[payments.length - 1];
  return NextResponse.json({ payment, order: updated });
}
