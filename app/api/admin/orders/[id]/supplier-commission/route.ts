import { NextResponse } from "next/server";
import { getOrder } from "@/lib/db/commerce";
import { recordSupplierPlatformCommission } from "@/lib/payments/record-platform-commission";
import { requireSession } from "@/lib/server/require-session";

type Params = { params: Promise<{ id: string }> };

/** Admin records supplier → platform commission (same rules as supplier self-serve). */
export async function POST(_request: Request, context: Params) {
  const auth = await requireSession(["admin"]);
  if (!auth.ok) return auth.response;

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
  return NextResponse.json({ order: updated });
}
