import { NextResponse } from "next/server";
import { findUserById } from "@/lib/db/users";
import { ROLE_PERMISSIONS } from "@/lib/rbac";
import type { Permission, UserRecord } from "@/lib/domain/types";
import { isStaffAdminRole } from "@/lib/admin-staff";

export function effectiveStaffPermissions(userId: string): Permission[] {
  const u = findUserById(userId);
  if (!u || !isStaffAdminRole(u.role)) return [];
  return effectivePermissionsFor(u);
}

function effectivePermissionsFor(user: UserRecord): Permission[] {
  if (user.role === "system_admin") {
    return [...ROLE_PERMISSIONS.system_admin];
  }
  if (user.role === "admin") {
    const base = ROLE_PERMISSIONS.admin;
    if (user.adminPermissionAllow !== undefined) {
      const allow = new Set(user.adminPermissionAllow);
      return base.filter((p) => allow.has(p));
    }
    /** Legacy rows: only explicit deny lists keep access until migrated to a whitelist. */
    const deny = user.adminPermissionDeny ?? [];
    if (deny.length > 0) {
      const denySet = new Set(deny);
      return base.filter((p) => !denySet.has(p));
    }
    return [];
  }
  return [];
}

export function staffUserHasPermission(userId: string, permission: Permission): boolean {
  const u = findUserById(userId);
  if (!u || !isStaffAdminRole(u.role)) return false;
  return effectivePermissionsFor(u).includes(permission);
}

/** First admin URL the user is allowed to open (avoids sending staff to login when they lack one page’s permission). */
const ADMIN_ROUTE_PRIORITY: { perm: Permission; href: string }[] = [
  { perm: "admin:dashboard", href: "/admin/dashboard" },
  { perm: "orders:admin", href: "/admin/orders" },
  { perm: "orders:complete", href: "/admin/orders" },
  { perm: "companies:verify", href: "/admin/verifications" },
  { perm: "moderation:manage", href: "/admin/moderation" },
  { perm: "categories:manage", href: "/admin/categories" },
  { perm: "system:configure", href: "/admin/system" },
  { perm: "system:manage-admins", href: "/admin/admins" },
  { perm: "system:audit-read", href: "/admin/audit" },
];

export function getFirstAccessibleAdminHref(userId: string): string {
  const perms = effectiveStaffPermissions(userId);
  if (perms.length === 0) return "/admin/pending-access";
  for (const { perm, href } of ADMIN_ROUTE_PRIORITY) {
    if (perms.includes(perm)) return href;
  }
  return "/admin/settings";
}

/** Admins may complete orders when `orders:complete` is granted. */
export function adminMayCompleteOrders(adminUserId: string): boolean {
  return staffUserHasPermission(adminUserId, "orders:complete");
}

export function requireStaffPermission(
  userId: string,
  permission: Permission,
): { ok: true } | { ok: false; response: NextResponse } {
  if (!staffUserHasPermission(userId, permission)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { ok: true };
}
