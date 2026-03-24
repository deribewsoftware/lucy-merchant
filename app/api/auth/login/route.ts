import { NextResponse } from "next/server";
import { signToken } from "@/lib/auth/jwt";
import { verifyPassword } from "@/lib/auth/password";
import { findUserByEmail } from "@/lib/db/users";
import { checkRateLimit, clientIp } from "@/lib/server/rate-limit";

const COOKIE = "lm_token";
const MAX_AGE = 60 * 60 * 24 * 7;

export async function POST(request: Request) {
  const ip = clientIp(request);
  const rl = checkRateLimit(`login:${ip}`, 30, 15 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many attempts. Retry in ${rl.retryAfterSec}s` },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const email = String(body?.email ?? "");
  const password = String(body?.password ?? "");
  if (!email || !password) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }

  const user = findUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const token = await signToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });

  const res = NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      points: user.points,
    },
  });
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
  return res;
}
