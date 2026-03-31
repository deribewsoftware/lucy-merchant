import { NextResponse } from "next/server";
import { getOrder, patchOrder } from "@/lib/db/commerce";
import {
  notifyAdminsOrderCompletedByAdmin,
  notifyMerchantOrderStatus,
  notifySuppliersOrderStatus,
} from "@/lib/db/notifications";
import { canAdminCompleteOrder } from "@/lib/domain/admin-order-completion";
import { ADMIN_STAFF_ROLES } from "@/lib/admin-staff";
import { logStaffAction } from "@/lib/server/admin-audit-log";
import { adminMayCompleteOrders } from "@/lib/server/admin-permissions";
import { requireSession } from "@/lib/server/require-session";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Params) {
  const auth = await requireSession(ADMIN_STAFF_ROLES);
  if (!auth.ok) return auth.response;
  if (!adminMayCompleteOrders(auth.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const order = getOrder(id);
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const gate = canAdminCompleteOrder(order);
  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.reason ?? "Cannot complete order" },
      { status: 400 },
    );
  }

  const updated = patchOrder(id, { status: "completed" });
  if (updated) {
    notifyMerchantOrderStatus(updated, "completed", { completedBy: "admin" });
    notifySuppliersOrderStatus(updated, "completed", { completedBy: "admin" });
    notifyAdminsOrderCompletedByAdmin(updated, auth.user.id);
    logStaffAction(request, {
      actorId: auth.user.id,
      action: "orders.complete",
      resource: id,
    });
  }
  return NextResponse.json({ order: updated });
}
