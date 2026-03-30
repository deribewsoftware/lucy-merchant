import { NextResponse } from "next/server";
import { isEmailVerified } from "@/lib/auth/email-verification";
import { normalizeEmail } from "@/lib/auth/register-validation";
import {
  formatNodemailerErrorForClient,
  isNodemailerConfigured,
  sendVerificationOtpEmail,
} from "@/lib/email/nodemailer";
import { findUserByEmail, issueNewVerificationOtp } from "@/lib/db/users";
import { checkRateLimit, clientIp } from "@/lib/server/rate-limit";

export async function POST(request: Request) {
  const ip = clientIp(request);
  const rl = checkRateLimit(`resend-verification:${ip}`, 5, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many resend requests. Retry in ${rl.retryAfterSec}s` },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const emailRaw = String(body?.email ?? "");
  if (!emailRaw) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const email = normalizeEmail(emailRaw);
  const user = findUserByEmail(email);
  if (!user) {
    return NextResponse.json({ ok: true });
  }

  if (isEmailVerified(user)) {
    return NextResponse.json({ error: "This email is already verified" }, { status: 400 });
  }

  if (!isNodemailerConfigured()) {
    const otp = await issueNewVerificationOtp(user.id);
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[resend-verification] Nodemailer not configured. Dev OTP for ${email}: ${otp}`,
      );
      return NextResponse.json({ ok: true, devOnly: true });
    }
    return NextResponse.json(
      {
        error:
          "Email is not configured on the server. Set NODEMAILER_FROM_EMAIL and NODEMAILER_PASSWORD (e.g. Gmail app password).",
      },
      { status: 503 },
    );
  }

  try {
    const code = await issueNewVerificationOtp(user.id);
    await sendVerificationOtpEmail({
      to: user.email,
      name: user.name,
      code,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[resend-verification] Nodemailer:", e);
    const detail =
      process.env.NODE_ENV !== "production" && e instanceof Error
        ? e.message
        : undefined;
    return NextResponse.json(
      {
        error: formatNodemailerErrorForClient(e),
        ...(detail ? { detail } : {}),
      },
      { status: 502 },
    );
  }
}
