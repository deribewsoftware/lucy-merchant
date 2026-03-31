import { NextResponse } from "next/server";
import { ADMIN_INVITE_DEFAULT_PASSWORD } from "@/lib/auth/admin-invite";
import { ADMIN_STAFF_ROLES } from "@/lib/admin-staff";
import {
  createUser,
  findUserById,
  listUsers,
  revokeStaffUser,
  setAdminTeamMember,
} from "@/lib/db/users";
import { createNotification } from "@/lib/db/notifications";
import { ROLE_PERMISSIONS } from "@/lib/rbac";
import { logStaffAction } from "@/lib/server/admin-audit-log";
import {
  effectiveStaffPermissions,
  staffUserHasPermission,
} from "@/lib/server/admin-permissions";
import { requireSession } from "@/lib/server/require-session";
import {
  formatNodemailerErrorForClient,
  isNodemailerConfigured,
  sendAdminInviteEmail,
} from "@/lib/email/nodemailer";
import { notifyAdminPermissionsUpdated } from "@/lib/email/notify-admin-permissions-updated";
import { isEmailVerified } from "@/lib/auth/email-verification";
import type { Permission, UserRole } from "@/lib/domain/types";

const TEAM_ROLES: UserRole[] = ["admin", "system_admin"];

function isAssignablePermission(p: string): p is Permission {
  return (ROLE_PERMISSIONS.admin as readonly string[]).includes(p);
}

export async function GET() {
  const auth = await requireSession(ADMIN_STAFF_ROLES);
  if (!auth.ok) return auth.response;
  if (!staffUserHasPermission(auth.user.id, "system:manage-admins")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const members = listUsers()
    .filter((u) => u.role === "admin" || u.role === "system_admin")
    .map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      emailVerified: isEmailVerified(u),
      adminPermissionDeny: u.adminPermissionDeny ?? [],
      adminPermissionAllow:
        u.adminPermissionAllow !== undefined ? u.adminPermissionAllow : null,
      permissionMode:
        u.adminPermissionAllow !== undefined ? ("allow" as const) : ("deny" as const),
      effectivePermissions: effectiveStaffPermissions(u.id),
      createdAt: u.createdAt,
    }));

  return NextResponse.json({
    members,
    assignablePermissions: [...ROLE_PERMISSIONS.admin],
    viewerRole: auth.user.role,
    viewerId: auth.user.id,
  });
}

export async function POST(request: Request) {
  const auth = await requireSession(ADMIN_STAFF_ROLES);
  if (!auth.ok) return auth.response;
  if (!staffUserHasPermission(auth.user.id, "system:manage-admins")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password =
    String(body?.password ?? "").trim() || ADMIN_INVITE_DEFAULT_PASSWORD;
  const nameRaw = String(body?.name ?? "").trim();
  const name = nameRaw || email.split("@")[0] || "Administrator";

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 },
    );
  }

  try {
    const { user } = await createUser({
      email,
      password,
      name,
      role: "admin",
      inviteAdmin: true,
      /** Invited staff can sign in immediately with email + password (no OTP). */
      skipEmailVerification: true,
    });

    let emailSent = false;
    let emailDeliveryError: string | undefined;
    let emailDeliveryDetail: string | undefined;

    if (!isNodemailerConfigured()) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[admin/team] Nodemailer not configured. Invite for ${user.email} — credentials not emailed (use the password from the invite form or resend after SMTP works).`,
        );
      }
      emailDeliveryError =
        process.env.NODE_ENV === "production"
          ? "Email is not configured on the server. Set NODEMAILER_FROM_EMAIL and NODEMAILER_PASSWORD (e.g. Gmail app password). You can resend credentials from this page after SMTP works."
          : "Email is not configured (NODEMAILER_FROM_EMAIL / NODEMAILER_PASSWORD). Share the password from the invite form manually, or resend after SMTP works.";
    } else {
      try {
        await sendAdminInviteEmail({
          to: user.email,
          name: user.name,
          loginEmail: user.email,
          initialPassword: password,
          isDefaultPassword: password === ADMIN_INVITE_DEFAULT_PASSWORD,
        });
        emailSent = true;
        console.info("[admin/team] invite email sent", { to: user.email });
      } catch (e) {
        console.error("[admin/team] invite email failed:", e);
        emailDeliveryError = formatNodemailerErrorForClient(e);
        if (process.env.NODE_ENV !== "production" && e instanceof Error) {
          emailDeliveryDetail = e.message;
        }
      }
    }

    logStaffAction(request, {
      actorId: auth.user.id,
      action: "admin.team.invite",
      resource: user.id,
      detail: { email: user.email, emailSent },
    });

    return NextResponse.json({
      ok: true,
      nodemailerConfigured: isNodemailerConfigured(),
      member: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: isEmailVerified(user),
        adminPermissionDeny: [],
        adminPermissionAllow: user.adminPermissionAllow ?? [],
        permissionMode: "allow" as const,
        effectivePermissions: effectiveStaffPermissions(user.id),
        createdAt: user.createdAt,
      },
      emailSent,
      needsVerification: false,
      ...(emailDeliveryError ? { emailDeliveryError } : {}),
      ...(emailDeliveryDetail ? { emailDeliveryDetail } : {}),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Create failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireSession(ADMIN_STAFF_ROLES);
  if (!auth.ok) return auth.response;
  if (!staffUserHasPermission(auth.user.id, "system:manage-admins")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const userId = String(body?.userId ?? "").trim();
  const roleIn = body?.role as UserRole | undefined;
  const denyIn = body?.adminPermissionDeny;
  const allowIn = body?.adminPermissionAllow;

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const target = findUserById(userId);
  if (!target || !TEAM_ROLES.includes(target.role)) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const previousEffective = effectiveStaffPermissions(userId);
  const previousRole = target.role;

  const nextRole = roleIn !== undefined ? roleIn : target.role;
  if (!TEAM_ROLES.includes(nextRole)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  if (
    nextRole === "system_admin" &&
    Array.isArray(allowIn) &&
    allowIn.length > 0
  ) {
    return NextResponse.json(
      { error: "System administrators use full permissions" },
      { status: 400 },
    );
  }

  if (
    nextRole === "system_admin" &&
    Array.isArray(denyIn) &&
    denyIn.length > 0
  ) {
    return NextResponse.json(
      { error: "System administrators have full permissions" },
      { status: 400 },
    );
  }

  const otherSystemAdmins = listUsers().filter(
    (u) => u.role === "system_admin" && u.id !== userId,
  );
  if (
    target.role === "system_admin" &&
    nextRole === "admin" &&
    otherSystemAdmins.length === 0
  ) {
    return NextResponse.json(
      { error: "Cannot demote the last system administrator" },
      { status: 400 },
    );
  }

  let updated;

  if (nextRole === "system_admin") {
    updated = setAdminTeamMember(userId, { role: "system_admin" });
  } else if (nextRole === "admin") {
    if (allowIn === null) {
      const deny = Array.isArray(denyIn)
        ? denyIn.filter(isAssignablePermission)
        : [];
      updated = setAdminTeamMember(userId, {
        role: "admin",
        adminPermissionAllow: null,
        adminPermissionDeny: deny,
      });
    } else if (Array.isArray(allowIn)) {
      updated = setAdminTeamMember(userId, {
        role: "admin",
        adminPermissionAllow: allowIn.filter(isAssignablePermission),
      });
    } else if (Array.isArray(denyIn)) {
      updated = setAdminTeamMember(userId, {
        role: "admin",
        adminPermissionDeny: denyIn.filter(isAssignablePermission),
      });
    } else if (roleIn !== undefined && target.role === "system_admin") {
      updated = setAdminTeamMember(userId, {
        role: "admin",
        adminPermissionAllow: [],
      });
    } else {
      updated = setAdminTeamMember(userId, { role: "admin" });
    }
  }

  if (!updated) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  logStaffAction(request, {
    actorId: auth.user.id,
    action: "admin.team.update",
    resource: userId,
    detail: {
      role: updated.role,
      adminPermissionDeny: updated.adminPermissionDeny ?? [],
      adminPermissionAllow: updated.adminPermissionAllow ?? null,
    },
  });

  const nextEffective = effectiveStaffPermissions(updated.id);
  const prevKey = [...previousEffective].sort().join(";");
  const nextKey = [...nextEffective].sort().join(";");
  const roleChanged = previousRole !== updated.role;
  const accessChanged = prevKey !== nextKey || roleChanged;

  if (accessChanged && updated.id !== auth.user.id) {
    const actor = findUserById(auth.user.id);
    const actorName = actor?.name ?? "A system administrator";
    if (updated.role === "system_admin") {
      createNotification({
        userId: updated.id,
        kind: "admin_staff",
        title: "You are now a system administrator",
        body: `${actorName} promoted you to full system access.`,
        href: "/admin/dashboard",
      });
    } else {
      createNotification({
        userId: updated.id,
        kind: "admin_staff",
        title: "Your admin access was updated",
        body: `${actorName} changed your role or permissions.`,
        href: "/admin/dashboard",
      });
    }
    try {
      await notifyAdminPermissionsUpdated({
        target: updated,
        actorName,
        previousPermissions: previousEffective,
        nextPermissions: nextEffective,
        roleChanged,
        previousRole,
        nextRole: updated.role,
      });
    } catch (e) {
      console.error("[admin/team] notify permissions:", e);
    }
  }

  return NextResponse.json({
    member: {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      emailVerified: isEmailVerified(updated),
      adminPermissionDeny: updated.adminPermissionDeny ?? [],
      adminPermissionAllow:
        updated.adminPermissionAllow !== undefined
          ? updated.adminPermissionAllow
          : null,
      permissionMode:
        updated.adminPermissionAllow !== undefined ? "allow" : "deny",
      effectivePermissions: nextEffective,
    },
  });
}

/**
 * System administrators only: remove a staff member’s admin access (demote to merchant).
 */
export async function DELETE(request: Request) {
  const auth = await requireSession(ADMIN_STAFF_ROLES);
  if (!auth.ok) return auth.response;
  if (auth.user.role !== "system_admin") {
    return NextResponse.json(
      { error: "Only system administrators can revoke staff access" },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const userId = String(body?.userId ?? "").trim();
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }
  if (userId === auth.user.id) {
    return NextResponse.json(
      { error: "You cannot revoke your own staff access" },
      { status: 400 },
    );
  }

  const target = findUserById(userId);
  if (!target || !TEAM_ROLES.includes(target.role)) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const otherSystemAdmins = listUsers().filter(
    (u) => u.role === "system_admin" && u.id !== userId,
  );
  if (target.role === "system_admin" && otherSystemAdmins.length === 0) {
    return NextResponse.json(
      { error: "Cannot revoke the last system administrator" },
      { status: 400 },
    );
  }

  const previousRole = target.role;
  const updated = revokeStaffUser(userId);
  if (!updated) {
    return NextResponse.json({ error: "Revoke failed" }, { status: 500 });
  }

  logStaffAction(request, {
    actorId: auth.user.id,
    action: "admin.team.revoke",
    resource: userId,
    detail: { email: target.email, previousRole },
  });

  const actor = findUserById(auth.user.id);
  const actorName = actor?.name ?? "A system administrator";
  createNotification({
    userId: target.id,
    kind: "admin_staff",
    title: "Your administrator access was removed",
    body: `${actorName} revoked your staff access. Your account is now a merchant account — sign in to use the merchant workspace.`,
    href: "/merchant/dashboard",
  });

  return NextResponse.json({ ok: true, revokedUserId: userId });
}
