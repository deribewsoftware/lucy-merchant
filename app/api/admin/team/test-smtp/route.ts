import { NextResponse } from "next/server";
import { ADMIN_STAFF_ROLES } from "@/lib/admin-staff";
import {
  formatNodemailerErrorForClient,
  isNodemailerConfigured,
  sendEmail,
} from "@/lib/email/nodemailer";
import { logStaffAction } from "@/lib/server/admin-audit-log";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { requireSession } from "@/lib/server/require-session";

/**
 * System administrators only: send a short test message to your own login email
 * to verify NODEMAILER_* on the server (after deploy).
 */
export async function POST(request: Request) {
  const auth = await requireSession(ADMIN_STAFF_ROLES);
  if (!auth.ok) return auth.response;
  if (auth.user.role !== "system_admin") {
    return NextResponse.json(
      { error: "Only system administrators can run the SMTP test" },
      { status: 403 },
    );
  }

  const rl = checkRateLimit(`test-smtp:${auth.user.id}`, 5, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many tests. Retry in ${rl.retryAfterSec}s` },
      { status: 429 },
    );
  }

  if (!isNodemailerConfigured()) {
    return NextResponse.json(
      {
        error:
          "SMTP is not configured. Set NODEMAILER_FROM_EMAIL and NODEMAILER_PASSWORD, then redeploy.",
      },
      { status: 503 },
    );
  }

  const label = process.env.NEXT_PUBLIC_APP_NAME ?? "Lucy Merchant";
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "") || "(not set — set NEXT_PUBLIC_APP_URL)";

  try {
    await sendEmail({
      to: auth.user.email,
      subject: `${label} — SMTP test`,
      text: [
        "This is a test message from your marketplace app.",
        "",
        `If you received this, outbound email (Nodemailer / SMTP) is working.`,
        "",
        `App URL (for links in emails): ${appUrl}`,
        "",
        `Time (UTC): ${new Date().toISOString()}`,
      ].join("\n"),
    });

    logStaffAction(request, {
      actorId: auth.user.id,
      action: "admin.team.test_smtp",
      resource: auth.user.id,
      detail: { to: auth.user.email },
    });

    return NextResponse.json({ ok: true, sentTo: auth.user.email });
  } catch (e) {
    console.error("[admin/team/test-smtp]", e);
    return NextResponse.json(
      {
        error: formatNodemailerErrorForClient(e),
        ...(process.env.NODE_ENV !== "production" && e instanceof Error
          ? { detail: e.message }
          : {}),
      },
      { status: 502 },
    );
  }
}
