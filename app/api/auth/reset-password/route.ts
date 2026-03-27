import { NextResponse } from "next/server";
import {
  normalizeEmail,
  validatePasswordStrength,
} from "@/lib/auth/register-validation";
import { verifyPassword } from "@/lib/auth/password";
import { findUserByEmail, updateUserPassword } from "@/lib/db/users";
import { checkRateLimit, clientIp } from "@/lib/server/rate-limit";

export async function POST(request: Request) {
  const ip = clientIp(request);
  const rl = checkRateLimit(`reset-password:${ip}`, 20, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many attempts. Retry in ${rl.retryAfterSec}s` },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const emailRaw = String(body?.email ?? "");
  const token = String(body?.token ?? "");
  const password = String(body?.password ?? "");
  const confirmPassword = String(body?.confirmPassword ?? "");

  if (!emailRaw.trim() || !token) {
    return NextResponse.json(
      { error: "Missing email or reset token. Open the link from your email." },
      { status: 400 },
    );
  }

  const pwErr = validatePasswordStrength(password);
  if (pwErr) {
    return NextResponse.json({ error: pwErr }, { status: 400 });
  }
  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
  }

  const email = normalizeEmail(emailRaw);
  const user = findUserByEmail(email);
  if (!user?.passwordResetTokenHash) {
    return NextResponse.json(
      { error: "Invalid or expired reset link. Request a new one from the forgot password page." },
      { status: 400 },
    );
  }

  const expires = user.passwordResetExpiresAt
    ? Date.parse(user.passwordResetExpiresAt)
    : 0;
  if (!expires || Date.now() > expires) {
    return NextResponse.json(
      { error: "This reset link has expired. Request a new one." },
      { status: 400 },
    );
  }

  const match = await verifyPassword(token, user.passwordResetTokenHash);
  if (!match) {
    return NextResponse.json(
      { error: "Invalid or expired reset link. Request a new one from the forgot password page." },
      { status: 400 },
    );
  }

  await updateUserPassword(user.id, password);
  return NextResponse.json({ ok: true });
}
