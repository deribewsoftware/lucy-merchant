import { NextResponse } from "next/server";
import { ADMIN_STAFF_ROLES } from "@/lib/admin-staff";
import { getOrder } from "@/lib/db/commerce";
import { recordSupplierPlatformCommission } from "@/lib/payments/record-platform-commission";
import { logStaffAction } from "@/lib/server/admin-audit-log";
import { requireStaffPermission } from "@/lib/server/admin-permissions";
import { requireSession } from "@/lib/server/require-session";

type Params = { params: Promise<{ id: string }> };

/** Admin records supplier → platform commission (same rules as supplier self-serve). */
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

  const updated = recordSupplierPlatformCommission(id);
  if (!updated) {
    return NextResponse.json(
      {
        error:
          "Could not record — order must be delivered, supplier commission must apply, and it must not already be recorded",
      },
      { status: 400 },
    );
  }
  logStaffAction(request, {
    actorId: auth.user.id,
    action: "orders.supplier_commission_record",
    resource: id,
  });
  return NextResponse.json({ order: updated });
}
