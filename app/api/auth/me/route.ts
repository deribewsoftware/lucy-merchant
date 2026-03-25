import { NextResponse } from "next/server";
import { findUserById } from "@/lib/db/users";
import { merchantHasOutstandingCommission } from "@/lib/server/merchant-commission";
import { requireSession } from "@/lib/server/require-session";
import { supplierHasOutstandingCommission } from "@/lib/server/supplier-commission";

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const row = findUserById(auth.user.id);
  const merchantCommissionHold =
    auth.user.role === "merchant"
      ? merchantHasOutstandingCommission(auth.user.id)
      : false;
  const supplierCommissionHold =
    auth.user.role === "supplier"
      ? supplierHasOutstandingCommission(auth.user.id)
      : false;

  return NextResponse.json({
    user: {
      id: auth.user.id,
      email: auth.user.email,
      role: auth.user.role,
      name: auth.user.name,
      points: row?.points,
      merchantCommissionHold,
      supplierCommissionHold,
    },
  });
}
