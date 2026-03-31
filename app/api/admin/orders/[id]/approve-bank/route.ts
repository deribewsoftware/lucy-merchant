import { NextResponse } from "next/server";
import { ADMIN_STAFF_ROLES } from "@/lib/admin-staff";
import { getOrder } from "@/lib/db/commerce";
import { activatePaidOrder } from "@/lib/payments/order-activation";
import { logStaffAction } from "@/lib/server/admin-audit-log";
import { requireStaffPermission } from "@/lib/server/admin-permissions";
import { requireSession } from "@/lib/server/require-session";

type Params = { params: Promise<{ id: string }> };

/** Admin approves a bank transfer after reviewing the merchant screenshot. */
export async function POST(request: Request, context: Params) {
  const auth = await requireSession(ADMIN_STAFF_ROLES);
  if (!auth.ok) return auth.response;
  const perm = requireStaffPermission(auth.user.id, "orders:admin");
  if (!perm.ok) return perm.response;

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
  logStaffAction(request, {
    actorId: auth.user.id,
    action: "orders.approve_bank",
    resource: id,
  });
  return NextResponse.json({ order: updated });
}
