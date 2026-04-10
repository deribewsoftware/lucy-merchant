import { NextResponse } from "next/server";
import { signToken } from "@/lib/auth/jwt";
import { isEmailVerified } from "@/lib/auth/email-verification";
import { findUserById, updateUserProfile } from "@/lib/db/users";
import type { UserPreferences } from "@/lib/domain/types";
import { isStaffAdminRole, roleDisplayLabel } from "@/lib/admin-staff";
import { resolveEmailPreferences } from "@/lib/user/email-preferences";
import { isNodemailerConfigured } from "@/lib/email/nodemailer";
import { requireSession } from "@/lib/server/require-session";
import { effectiveStaffPermissions } from "@/lib/server/admin-permissions";

const MAX_DISPLAY_NAME_LEN = 200;

const SESSION_COOKIE = "lm_token";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function sanitizePreferences(
  raw: unknown,
): Partial<UserPreferences> | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const out: Partial<UserPreferences> = {};
  if (typeof o.emailOrderUpdates === "boolean") {
    out.emailOrderUpdates = o.emailOrderUpdates;
  }
  if (typeof o.emailReviewsAndComments === "boolean") {
    out.emailReviewsAndComments = o.emailReviewsAndComments;
  }
  if (typeof o.emailChatMirrors === "boolean") {
    out.emailChatMirrors = o.emailChatMirrors;
  }
  if (typeof o.emailAccountAlerts === "boolean") {
    out.emailAccountAlerts = o.emailAccountAlerts;
  }
  return Object.keys(out).length ? out : undefined;
}

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const row = findUserById(auth.user.id);
  const resolved = resolveEmailPreferences(row);

  const staffPerms =
    row && isStaffAdminRole(row.role)
      ? effectiveStaffPermissions(auth.user.id)
      : null;

  return NextResponse.json({
    userId: auth.user.id,
    name: auth.user.name,
    email: auth.user.email,
    role: auth.user.role,
    roleDisplay: roleDisplayLabel(auth.user.role),
    staffPermissions: staffPerms,
    supplierPoints:
      row?.role === "supplier" ? (row.points ?? null) : null,
    createdAt: row?.createdAt ?? null,
    emailVerified: row ? isEmailVerified(row) : true,
    mustChangePassword: row?.mustChangePassword === true,
    nationalIdStatus:
      row && (row.role === "merchant" || row.role === "supplier")
        ? row.nationalIdStatus ?? "none"
        : null,
    staffAccessPending:
      row?.role === "admin" ? (staffPerms?.length ?? 0) === 0 : false,
    preferences: resolved,
    emailDeliveryConfigured: isNodemailerConfigured(),
  });
}

export async function PATCH(request: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const name = body.name !== undefined ? String(body.name).trim() : undefined;
  const prefs = sanitizePreferences(body.preferences);

  if (name !== undefined && !name) {
    return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
  }
  if (name !== undefined && name.length > MAX_DISPLAY_NAME_LEN) {
    return NextResponse.json(
      { error: `Display name must be at most ${MAX_DISPLAY_NAME_LEN} characters` },
      { status: 400 },
    );
  }

  if (name === undefined && !prefs) {
    return NextResponse.json(
      { error: "Nothing to update — provide name or preferences" },
      { status: 400 },
    );
  }

  const updated = updateUserProfile(auth.user.id, {
    ...(name !== undefined ? { name } : {}),
    ...(prefs ? { preferences: prefs } : {}),
  });

  if (!updated) {
    return NextResponse.json({ error: "Could not update" }, { status: 400 });
  }

  const res = NextResponse.json({
    ok: true,
    name: updated.name,
    preferences: resolveEmailPreferences(updated),
  });

  if (name !== undefined) {
    const token = await signToken({
      sub: updated.id,
      email: updated.email,
      role: updated.role,
      name: updated.name,
      authChannel: auth.user.authChannel ?? "password",
    });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
  }

  return res;
}
