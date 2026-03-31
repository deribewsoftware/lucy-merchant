import { NextResponse } from "next/server";
import { createUser, findUserByEmail } from "@/lib/db/users";
import { signToken } from "@/lib/auth/jwt";
import { ROLE_PERMISSIONS } from "@/lib/rbac";
import type { Permission } from "@/lib/domain/types";

const COOKIE = "lm_token";
const MAX_AGE = 60 * 60 * 24 * 7;

/**
 * One-time or controlled admin creation when ADMIN_BOOTSTRAP_KEY matches.
 */
export async function POST(request: Request) {
  const key = process.env.ADMIN_BOOTSTRAP_KEY;
  if (!key || key.length < 8) {
    return NextResponse.json(
      { error: "Admin bootstrap is not configured" },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  if (String(body?.bootstrapKey ?? "") !== key) {
    return NextResponse.json({ error: "Invalid bootstrap key" }, { status: 403 });
  }

  const email = String(body?.email ?? "");
  const password = String(body?.password ?? "");
  const name = String(body?.name ?? "Admin");
  if (!email || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (findUserByEmail(email)) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const roleRaw = String(body?.role ?? "admin");
  const role =
    roleRaw === "system_admin" ? "system_admin" : ("admin" as const);

  const { user } = await createUser({
    email,
    password,
    name,
    role,
    skipEmailVerification: true,
    ...(role === "admin"
      ? {
          adminPermissionAllow: [...ROLE_PERMISSIONS.admin] as Permission[],
        }
      : {}),
  });
  const token = await signToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });

  const res = NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, role: user.role, name: user.name },
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
