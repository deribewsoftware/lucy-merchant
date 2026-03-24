import { NextResponse } from "next/server";
import { getSystemConfig, updateSystemConfig } from "@/lib/db/catalog";
import { requireSession } from "@/lib/server/require-session";

export async function GET() {
  const auth = await requireSession(["admin"]);
  if (!auth.ok) return auth.response;
  return NextResponse.json({ config: getSystemConfig() });
}

export async function PATCH(request: Request) {
  const auth = await requireSession(["admin"]);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const patch: Partial<import("@/lib/domain/types").SystemConfig> = {};
  if (typeof body.postProductPoints === "number") {
    patch.postProductPoints = body.postProductPoints;
  }
  if (typeof body.orderCommissionPercent === "number") {
    patch.orderCommissionPercent = body.orderCommissionPercent;
  }
  if (typeof body.featuredProductCost === "number") {
    patch.featuredProductCost = body.featuredProductCost;
  }
  if (typeof body.freePostingEnabled === "boolean") {
    patch.freePostingEnabled = body.freePostingEnabled;
  }
  if (typeof body.freeCommissionEnabled === "boolean") {
    patch.freeCommissionEnabled = body.freeCommissionEnabled;
  }

  const config = updateSystemConfig(patch);
  return NextResponse.json({ config });
}
