import { NextResponse } from "next/server";
import { submitNationalIdVerification } from "@/lib/db/users";
import { notifyAdminsNewVerificationRequest } from "@/lib/db/notifications";
import { requireSession } from "@/lib/server/require-session";
import { checkRateLimit } from "@/lib/server/rate-limit";

export async function POST(request: Request) {
  const auth = await requireSession(["merchant", "supplier"]);
  if (!auth.ok) return auth.response;

  const rl = checkRateLimit(`idverify:${auth.user.id}`, 5, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many attempts. Retry in ${rl.retryAfterSec}s` },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const nationalIdNumber = String(body?.nationalIdNumber ?? "").trim();
  const nationalIdName = String(body?.nationalIdName ?? "").trim();
  const nationalIdFrontImage = String(body?.nationalIdFrontImage ?? "").trim();
  const nationalIdBackImage = String(body?.nationalIdBackImage ?? "").trim();

  if (!nationalIdNumber || !nationalIdName) {
    return NextResponse.json(
      { error: "National ID number and full name are required" },
      { status: 400 },
    );
  }

  if (!nationalIdFrontImage || !nationalIdBackImage) {
    return NextResponse.json(
      { error: "Both front and back ID image URLs are required" },
      { status: 400 },
    );
  }

  const updated = submitNationalIdVerification(auth.user.id, {
    nationalIdNumber,
    nationalIdName,
    nationalIdFrontImage,
    nationalIdBackImage,
  });

  if (!updated) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  notifyAdminsNewVerificationRequest(auth.user.id, "national_id");

  return NextResponse.json({
    status: updated.nationalIdStatus,
    message: "Your National ID has been submitted for verification. You will be notified once reviewed.",
  });
}
