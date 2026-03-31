import { NextResponse } from "next/server";
import { ADMIN_STAFF_ROLES } from "@/lib/admin-staff";
import { getOrder, patchOrder } from "@/lib/db/commerce";
import { notifyCommissionProofsAcknowledged } from "@/lib/db/notifications";
import { logStaffAction } from "@/lib/server/admin-audit-log";
import { requireStaffPermission } from "@/lib/server/admin-permissions";
import { requireSession } from "@/lib/server/require-session";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

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

  const updated = patchOrder(id, {
    adminCommissionProofsAcknowledgedAt: new Date().toISOString(),
    adminCommissionProofsAcknowledgedBy: auth.user.id,
  });
  if (updated) {
    notifyCommissionProofsAcknowledged(updated);
    logStaffAction(request, {
      actorId: auth.user.id,
      action: "orders.acknowledge_commission_proofs",
      resource: id,
    });
  }
  return NextResponse.json({ order: updated });
}
