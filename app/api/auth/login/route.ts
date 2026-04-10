import { NextResponse } from "next/server";
import { signToken } from "@/lib/auth/jwt";
import { isEmailVerified } from "@/lib/auth/email-verification";
import { verifyPassword } from "@/lib/auth/password";
import type { LoginSuccessResponse } from "@/lib/domain/types";
import { findUserByEmail } from "@/lib/db/users";
import { notifySuperAdminsAdminNeedsAccess } from "@/lib/email/notify-super-admins-access";
import {
  effectiveStaffPermissions,
  getFirstAccessibleAdminHref,
} from "@/lib/server/admin-permissions";
import { checkRateLimit, clientIp } from "@/lib/server/rate-limit";
import { logStaffLogin } from "@/lib/server/admin-audit-log";
import { setLmSessionCookie } from "@/lib/server/lm-session-cookie";

export async function POST(request: Request) {
  const ip = clientIp(request);
  const rl = checkRateLimit(`login:${ip}`, 30, 15 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many attempts. Retry in ${rl.retryAfterSec}s` },
      { status: 429 },
    );
  }

  const input = await request.json().catch(() => null);
  const email = String(input?.email ?? "");
  const password = String(input?.password ?? "");
  if (!email || !password) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }

  const user = findUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  if (!isEmailVerified(user)) {
    return NextResponse.json(
      {
        error: "Verify your email before signing in. Check your inbox for a code.",
        code: "EMAIL_NOT_VERIFIED",
      },
      { status: 403 },
    );
  }

  let adminAccessPending = false;
  if (user.role === "admin") {
    await notifySuperAdminsAdminNeedsAccess(user);
    adminAccessPending = effectiveStaffPermissions(user.id).length === 0;
  }

  const token = await signToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    authChannel: "password",
  });

  logStaffLogin(request, { userId: user.id, role: user.role });

  const staffHomePath =
    user.role === "admin" || user.role === "system_admin"
      ? getFirstAccessibleAdminHref(user.id)
      : undefined;

  const successPayload: LoginSuccessResponse = {
    ok: true,
    adminAccessPending,
    mustChangePassword: user.mustChangePassword === true,
    staffHomePath,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      points: user.points,
    },
  };
  const res = NextResponse.json(successPayload);
  setLmSessionCookie(res, token);
  return res;
}
