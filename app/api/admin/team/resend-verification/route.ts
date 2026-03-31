import { NextResponse } from "next/server";
import { ADMIN_INVITE_DEFAULT_PASSWORD } from "@/lib/auth/admin-invite";
import { ADMIN_STAFF_ROLES } from "@/lib/admin-staff";
import {
  findUserById,
  markUserEmailVerified,
  updateUserPassword,
} from "@/lib/db/users";
import {
  formatNodemailerErrorForClient,
  isNodemailerConfigured,
  sendAdminInviteEmail,
} from "@/lib/email/nodemailer";
import { logStaffAction } from "@/lib/server/admin-audit-log";
import {
  staffUserHasPermission,
} from "@/lib/server/admin-permissions";
import { requireSession } from "@/lib/server/require-session";

const TEAM_ROLES = new Set(["admin", "system_admin"]);

export async function POST(request: Request) {
  const auth = await requireSession(ADMIN_STAFF_ROLES);
  if (!auth.ok) return auth.response;
  if (!staffUserHasPermission(auth.user.id, "system:manage-admins")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const userId = String(body?.userId ?? "").trim();
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const target = findUserById(userId);
  if (!target || !TEAM_ROLES.has(target.role)) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!isNodemailerConfigured()) {
    return NextResponse.json(
      {
        error:
          "Email is not configured on the server. Set NODEMAILER_FROM_EMAIL and NODEMAILER_PASSWORD (e.g. Gmail app password).",
      },
      { status: 503 },
    );
  }

  try {
    await updateUserPassword(target.id, ADMIN_INVITE_DEFAULT_PASSWORD, {
      mustChangePassword: true,
    });
    markUserEmailVerified(target.id);

    await sendAdminInviteEmail({
      to: target.email,
      name: target.name,
      loginEmail: target.email,
      initialPassword: ADMIN_INVITE_DEFAULT_PASSWORD,
      isDefaultPassword: true,
      credentialsReset: true,
    });

    logStaffAction(request, {
      actorId: auth.user.id,
      action: "admin.team.resend_credentials",
      resource: target.id,
      detail: { email: target.email },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/team/resend-verification]", e);
    return NextResponse.json(
      {
        error: formatNodemailerErrorForClient(e),
        ...(process.env.NODE_ENV !== "production" && e instanceof Error
          ? { detail: e.message }
          : {}),
      },
      { status: 502 },
    );
  }
}
