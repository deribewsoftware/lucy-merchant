import { NextResponse } from "next/server";
import { getOrder } from "@/lib/db/commerce";
import { activatePaidOrder } from "@/lib/payments/order-activation";
import { requireSession } from "@/lib/server/require-session";

type Params = { params: Promise<{ id: string }> };

/** Admin approves a bank transfer after reviewing the merchant screenshot. */
export async function POST(_request: Request, context: Params) {
  const auth = await requireSession(["admin"]);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const order = getOrder(id);
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (order.status !== "awaiting_bank_review") {
    return NextResponse.json(
      { error: "Order is not waiting for bank approval" },
      { status: 400 },
    );
  }
  if (order.paymentStatus === "paid") {
    return NextResponse.json({ error: "Already paid" }, { status: 400 });
  }

  const updated = activatePaidOrder(id, "bank-approved");
  if (!updated) {
    return NextResponse.json({ error: "Could not approve" }, { status: 400 });
  }
  return NextResponse.json({ order: updated });
}
