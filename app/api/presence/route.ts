import { NextResponse } from "next/server";
import { MERCHANT_SUPPLIER_STAFF_ROLES } from "@/lib/admin-staff";
import { touchPresence } from "@/lib/db/presence";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { requireSession } from "@/lib/server/require-session";

/**
 * Heartbeat so other participants can see you as online / last seen.
 * Accepts merchant, supplier, and staff (`admin` / `system_admin`), including locked admins.
 */
export async function POST() {
  const auth = await requireSession(MERCHANT_SUPPLIER_STAFF_ROLES);
  if (!auth.ok) return auth.response;

  const rl = checkRateLimit(`presence:${auth.user.id}`, 30, 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Slow down. Retry in ${rl.retryAfterSec}s` },
      { status: 429 },
    );
  }

  touchPresence(auth.user.id);
  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
