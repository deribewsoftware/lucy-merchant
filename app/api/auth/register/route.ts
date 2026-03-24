import { NextResponse } from "next/server";
import {
  normalizeEmail,
  validateRegisterPayload,
} from "@/lib/auth/register-validation";
import { createUser, findUserByEmail } from "@/lib/db/users";
import type { UserRole } from "@/lib/domain/types";
import { checkRateLimit, clientIp } from "@/lib/server/rate-limit";

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

    await createUser({ email, password, name: name.trim(), role });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Registration failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
