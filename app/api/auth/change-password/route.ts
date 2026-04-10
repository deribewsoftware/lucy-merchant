import { NextResponse } from "next/server";
import { signToken } from "@/lib/auth/jwt";
import { validatePasswordStrength } from "@/lib/auth/register-validation";
import { verifyPassword } from "@/lib/auth/password";
import { findUserById, updateUserPassword } from "@/lib/db/users";
import { requireSession } from "@/lib/server/require-session";

const SESSION_COOKIE = "lm_token";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export async function POST(request: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const { currentPassword, password, confirmPassword } = body as {
    currentPassword?: string;
    password?: string;
    confirmPassword?: string;
  };

  if (!password || !confirmPassword) {
    return NextResponse.json({ error: "New password fields are required" }, { status: 400 });
  }

  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
  }

  const strengthErr = validatePasswordStrength(password);
  if (strengthErr) {
    return NextResponse.json({ error: strengthErr }, { status: 400 });
  }

  const row = findUserById(auth.user.id);
  if (!row) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const channel = auth.user.authChannel ?? "password";
  const skipCurrentVerify =
    row.mustChangePassword === true && channel === "oauth";

  if (!skipCurrentVerify) {
    if (!currentPassword) {
      return NextResponse.json({ error: "Current password is required" }, { status: 400 });
    }
    const match = await verifyPassword(currentPassword, row.passwordHash);
    if (!match) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 });
    }
  }

  await updateUserPassword(auth.user.id, password);

  const res = NextResponse.json({ ok: true, message: "Password updated successfully" });
  const token = await signToken({
    sub: row.id,
    email: row.email,
    role: row.role,
    name: row.name,
    authChannel: "password",
  });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
