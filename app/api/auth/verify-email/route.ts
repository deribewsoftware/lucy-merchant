import { NextResponse } from "next/server";
import { isEmailVerified } from "@/lib/auth/email-verification";
import { normalizeEmail } from "@/lib/auth/register-validation";
import { verifyPassword } from "@/lib/auth/password";
import { findUserByEmail, markUserEmailVerified } from "@/lib/db/users";
import { isSendGridConfigured, sendWelcomeEmail } from "@/lib/email/sendgrid";
import { checkRateLimit, clientIp } from "@/lib/server/rate-limit";

export async function POST(request: Request) {
  const ip = clientIp(request);
  const rl = checkRateLimit(`verify-email:${ip}`, 30, 15 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many attempts. Retry in ${rl.retryAfterSec}s` },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const emailRaw = String(body?.email ?? "");
  const code = String(body?.code ?? "").replace(/\D/g, "");
  if (!emailRaw || code.length !== 6) {
    return NextResponse.json({ error: "Enter the 6-digit code from your email" }, { status: 400 });
  }

  const email = normalizeEmail(emailRaw);
  const user = findUserByEmail(email);
  if (!user) {
    return NextResponse.json({ error: "No account found for this email" }, { status: 404 });
  }

  if (isEmailVerified(user)) {
    return NextResponse.json({ ok: true, alreadyVerified: true });
  }

  const expires = user.emailVerificationOtpExpiresAt
    ? Date.parse(user.emailVerificationOtpExpiresAt)
    : 0;
  if (!user.emailVerificationOtpHash || !expires || Date.now() > expires) {
    return NextResponse.json(
      { error: "Code expired. Request a new code from the sign-up page." },
      { status: 400 },
    );
  }

  const match = await verifyPassword(code, user.emailVerificationOtpHash);
  if (!match) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  markUserEmailVerified(user.id);

  if (
    isSendGridConfigured() &&
    (user.role === "merchant" || user.role === "supplier")
  ) {
    void sendWelcomeEmail({
      to: user.email,
      name: user.name,
      role: user.role,
    }).catch((e) => console.error("[auth/verify-email] welcome email:", e));
  }

  return NextResponse.json({ ok: true });
}
