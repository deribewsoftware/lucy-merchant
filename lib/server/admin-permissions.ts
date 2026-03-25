import { findUserById } from "@/lib/db/users";
import { roleHasPermission } from "@/lib/rbac";

/** Admins may complete orders unless `orders:complete` is denied on their user record. */
export function adminMayCompleteOrders(adminUserId: string): boolean {
  const u = findUserById(adminUserId);
  if (!u || u.role !== "admin") return false;
  const deny = u.adminPermissionDeny ?? [];
  if (deny.includes("orders:complete")) return false;
  return roleHasPermission("admin", "orders:complete");
}
