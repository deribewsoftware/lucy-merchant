import { NextResponse } from "next/server";
import { companiesByOwner } from "@/lib/db/catalog";
import { getOrder, patchOrder } from "@/lib/db/commerce";
import { notifyMerchantSupplierConfirmedPaymentReceived } from "@/lib/db/notifications";
import { markPendingPaymentPaid } from "@/lib/db/payments";
import { isSingleSupplierOrder } from "@/lib/domain/order-split";
import { requireSession } from "@/lib/server/require-session";

type Params = { params: Promise<{ id: string }> };

/** Supplier confirms the buyer paid (bank transfer to supplier or COD collected). */
export async function POST(_request: Request, context: Params) {
  const auth = await requireSession(["supplier"]);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const order = getOrder(id);
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!isSingleSupplierOrder(order)) {
    return NextResponse.json(
      { error: "Use single-supplier orders only" },
      { status: 400 },
    );
  }
  const mine = new Set(companiesByOwner(auth.user.id).map((c) => c.id));
  const supplierCompanyId = order.items[0].companyId;
  if (!mine.has(supplierCompanyId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (order.paymentStatus === "paid") {
    return NextResponse.json({ error: "Already marked paid" }, { status: 400 });
  }
  if (order.status === "completed" || order.status === "rejected") {
    return NextResponse.json({ error: "Order is closed" }, { status: 400 });
  }

  markPendingPaymentPaid(id, "supplier-confirmed");
  const updated = patchOrder(id, { paymentStatus: "paid" });
  if (updated) {
    notifyMerchantSupplierConfirmedPaymentReceived(updated);
  }
  return NextResponse.json({ order: updated });
}
