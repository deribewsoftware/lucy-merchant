import { NextResponse } from "next/server";
import { getOrder, patchOrder } from "@/lib/db/commerce";
import { requireSession } from "@/lib/server/require-session";
import { adminMayCompleteOrders } from "@/lib/server/admin-permissions";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Params) {
  const auth = await requireSession(["admin"]);
  if (!auth.ok) return auth.response;
  if (!adminMayCompleteOrders(auth.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const order = getOrder(id);
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = patchOrder(id, {
    adminCommissionProofsAcknowledgedAt: new Date().toISOString(),
    adminCommissionProofsAcknowledgedBy: auth.user.id,
  });
  return NextResponse.json({ order: updated });
}
