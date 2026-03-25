import { NextResponse } from "next/server";
import { touchPresence } from "@/lib/db/presence";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { requireSession } from "@/lib/server/require-session";

/** Heartbeat so other participants can see you as online / last seen */
export async function POST() {
  const auth = await requireSession(["merchant", "supplier", "admin"]);
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
