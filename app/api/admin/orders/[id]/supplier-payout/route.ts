import { NextResponse } from "next/server";
import { getOrder } from "@/lib/db/commerce";
import { recordMerchantPlatformCommission } from "@/lib/payments/record-platform-commission";
import { requireSession } from "@/lib/server/require-session";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Params) {
  const auth = await requireSession(["admin"]);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const order = getOrder(id);
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = recordMerchantPlatformCommission(id);
  if (!updated) {
    return NextResponse.json(
      {
        error:
          "Could not record — order must be delivered and commission not yet recorded",
      },
      { status: 400 },
    );
  }
  return NextResponse.json({ order: updated });
}
