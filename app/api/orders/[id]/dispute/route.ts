import { NextResponse } from "next/server";
import { getOrder, patchOrder } from "@/lib/db/commerce";
import { notifyStakeholdersMerchantDispute } from "@/lib/db/notifications";
import { merchantMayOpenDeliveryDispute } from "@/lib/domain/order-dispute";
import { requireSession } from "@/lib/server/require-session";

type Params = { params: Promise<{ id: string }> };

/** Merchant reports late delivery — after the stated business-day window from acceptance. */
export async function POST(request: Request, context: Params) {
  const auth = await requireSession(["merchant"]);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const order = getOrder(id);
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (order.merchantId !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const reason = String(body?.reason ?? "").trim();
  if (reason.length < 20) {
    return NextResponse.json(
      {
        error:
          "Describe the problem clearly so we can help (at least 20 characters).",
      },
      { status: 400 },
    );
  }
  if (reason.length > 2000) {
    return NextResponse.json(
      { error: "Reason is too long (max 2000 characters)." },
      { status: 400 },
    );
  }

  if (!merchantMayOpenDeliveryDispute(order)) {
    return NextResponse.json(
      {
        error:
          "A delivery dispute is only available after the supplier’s stated business-day window has passed, and while the order is not yet delivered or closed.",
      },
      { status: 400 },
    );
  }

  const updated = patchOrder(id, {
    merchantDisputeOpenedAt: new Date().toISOString(),
    merchantDisputeReason: reason,
  });
  if (updated) {
    notifyStakeholdersMerchantDispute(updated);
  }
  return NextResponse.json({ order: updated });
}
