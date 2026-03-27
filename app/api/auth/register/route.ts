import { NextResponse } from "next/server";
import {
  normalizeEmail,
  validateRegisterPayload,
} from "@/lib/auth/register-validation";
import { createUser, findUserByEmail } from "@/lib/db/users";
import type { UserRole } from "@/lib/domain/types";
import { checkRateLimit, clientIp } from "@/lib/server/rate-limit";
import { isSendGridConfigured, sendVerificationOtpEmail } from "@/lib/email/sendgrid";

export async function POST(request: Request) {
  const ip = clientIp(request);
  const rl = checkRateLimit(`register:${ip}`, 10, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many registrations from this network. Retry in ${rl.retryAfterSec}s` },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();
    const emailRaw = String(body.email ?? "");
    const password = String(body.password ?? "");
    const confirmPassword = String(body.confirmPassword ?? "");
    const name = String(body.name ?? "");
    const role = body.role as UserRole;

    if (role !== "merchant" && role !== "supplier") {
      return NextResponse.json(
        { error: "Role must be merchant or supplier" },
        { status: 400 },
      );
    }

    const validationError = validateRegisterPayload({
      name,
      email: emailRaw,
      password,
      confirmPassword,
    });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const email = normalizeEmail(emailRaw);

    if (findUserByEmail(email)) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const { user, verificationOtp } = await createUser({
      email,
      password,
      name: name.trim(),
      role,
    });

    let emailSent = false;
    if (verificationOtp) {
      if (isSendGridConfigured()) {
        try {
          await sendVerificationOtpEmail({
            to: user.email,
            name: user.name,
            code: verificationOtp,
          });
          emailSent = true;
        } catch (e) {
          console.error("[auth/register] SendGrid error:", e);
        }
      } else if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[auth/register] SENDGRID_* not configured. Dev OTP for ${user.email}: ${verificationOtp}`,
        );
      }
    }

    return NextResponse.json({
      ok: true,
      emailSent,
      needsVerification: Boolean(verificationOtp),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Registration failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
