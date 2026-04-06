import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getPublicAppUrl } from "@/lib/app-url";
import {
  isValidEmail,
  normalizeEmail,
} from "@/lib/auth/register-validation";
import { findUserByEmail, setPasswordResetToken } from "@/lib/db/users";
import {
  formatNodemailerErrorForClient,
  isNodemailerConfigured,
  sendPasswordResetEmail,
} from "@/lib/email/nodemailer";
import { checkRateLimit, clientIp } from "@/lib/server/rate-limit";

/** Nodemailer, DNS resolution, and JSON user store require Node (not Edge). */
export const runtime = "nodejs";

function generateResetToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  const rl = checkRateLimit(`forgot-password:${ip}`, 10, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many requests. Retry in ${rl.retryAfterSec}s` },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const emailRaw = String(body?.email ?? "");
  if (!emailRaw.trim()) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }
  if (!isValidEmail(emailRaw)) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  const email = normalizeEmail(emailRaw);
  const user = findUserByEmail(email);

  if (user) {
    const token = generateResetToken();
    await setPasswordResetToken(user.id, token);
    const appUrl = getPublicAppUrl();
    const resetUrl = `${appUrl}/reset-password?${new URLSearchParams({
      email,
      token,
    }).toString()}`;

    if (isNodemailerConfigured()) {
      try {
        await sendPasswordResetEmail({
          to: user.email,
          name: user.name,
          resetUrl,
        });
      } catch (e) {
        console.error(
          "[auth/forgot-password] Nodemailer:",
          formatNodemailerErrorForClient(e),
          e,
        );
      }
    } else if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[auth/forgot-password] Nodemailer not configured (NODEMAILER_FROM_EMAIL, NODEMAILER_PASSWORD). Dev reset link for ${email}:\n${resetUrl}`,
      );
    } else {
      console.error(
        "[auth/forgot-password] Nodemailer not configured; cannot send reset email. Set NODEMAILER_FROM_EMAIL and NODEMAILER_PASSWORD.",
      );
    }
  }

  return NextResponse.json({
    ok: true,
    message:
      "If an account exists for that email, you will receive a password reset link shortly.",
  });
}
