import { redirect } from "next/navigation";
import { defaultHomePath } from "@/lib/auth/portal-routes";
import type { Permission } from "@/lib/domain/types";
import { isStaffAdminRole } from "@/lib/admin-staff";
import {
  effectiveStaffPermissions,
  getFirstAccessibleAdminHref,
  staffUserHasPermission,
} from "@/lib/server/admin-permissions";
import { getSessionUser } from "@/lib/server/session";

const PENDING_ACCESS = "/admin/pending-access";

/** Admins with no effective permissions (whitelist empty, etc.) may only use pending-access + settings. */
export async function redirectIfLockedStaffAdmin(): Promise<void> {
  const user = await getSessionUser();
  if (!user || !isStaffAdminRole(user.role) || user.role === "system_admin") {
    return;
  }
  if (effectiveStaffPermissions(user.id).length === 0) {
    redirect(PENDING_ACCESS);
  }
}

/** Any signed-in staff user (including locked admins) — for settings / pending-access pages. */
export async function requireStaffSession(
  loginNext = "/admin/dashboard",
): Promise<void> {
  const user = await getSessionUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(loginNext)}`);
  }
  if (!isStaffAdminRole(user.role)) {
    redirect(`${defaultHomePath(user.role)}?notice=staff_only`);
  }
}

/** Redirects when the signed-in staff user lacks the permission. */
export async function requireStaffPagePermission(
  permission: Permission,
  loginNext = "/admin/dashboard",
): Promise<void> {
  const user = await getSessionUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(loginNext)}`);
  }
  if (!isStaffAdminRole(user.role)) {
    redirect(`${defaultHomePath(user.role)}?notice=staff_only`);
  }
  await redirectIfLockedStaffAdmin();
  if (!staffUserHasPermission(user.id, permission)) {
    redirect(getFirstAccessibleAdminHref(user.id));
  }
}

/** Orders UI needs at least one of the order capabilities. */
export async function requireStaffOrdersPageAccess(
  loginNext = "/admin/orders",
): Promise<void> {
  const user = await getSessionUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(loginNext)}`);
  }
  if (!isStaffAdminRole(user.role)) {
    redirect(`${defaultHomePath(user.role)}?notice=staff_only`);
  }
  await redirectIfLockedStaffAdmin();
  const ok =
    staffUserHasPermission(user.id, "orders:admin") ||
    staffUserHasPermission(user.id, "orders:complete");
  if (!ok) {
    redirect(getFirstAccessibleAdminHref(user.id));
  }
}
