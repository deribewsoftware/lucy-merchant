import { NextResponse } from "next/server";
import { isEmailVerified } from "@/lib/auth/email-verification";
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

  const base = {
    id: auth.user.id,
    email: auth.user.email,
    role: auth.user.role,
    name: auth.user.name,
    points: row?.points,
    emailVerified: row ? isEmailVerified(row) : true,
    merchantCommissionHold,
    supplierCommissionHold,
  };

  const fayda =
    row && (row.role === "merchant" || row.role === "supplier")
      ? {
          nationalIdStatus: row.nationalIdStatus,
          nationalIdFan: row.nationalIdFan,
          nationalIdName: row.nationalIdName,
          nationalIdFrontImage: row.nationalIdFrontImage,
          nationalIdBackImage: row.nationalIdBackImage,
          nationalIdCity: row.nationalIdCity,
          nationalIdSubcity: row.nationalIdSubcity,
          nationalIdWoreda: row.nationalIdWoreda,
          nationalIdPhoneOnId: row.nationalIdPhoneOnId,
          nationalIdAddressLine: row.nationalIdAddressLine,
          nationalIdSubmittedAt: row.nationalIdSubmittedAt,
          nationalIdRejectionReason: row.nationalIdRejectionReason,
          nationalIdReviewedAt: row.nationalIdReviewedAt,
        }
      : {};

  return NextResponse.json({
    user: { ...base, ...fayda },
  });
}
