import type { Permission, UserRole } from "@/lib/domain/types";

export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  admin: [
    "admin:dashboard",
    "companies:verify",
    "categories:manage",
    "system:configure",
    "orders:complete",
  ],
  supplier: ["companies:manage", "products:manage", "orders:supplier"],
  merchant: [
    "market:browse",
    "cart:manage",
    "orders:merchant",
    "reviews:create",
  ],
};

export function roleHasPermission(
  role: UserRole,
  permission: Permission,
): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function assertRolePath(role: UserRole, pathname: string): boolean {
  if (pathname.startsWith("/admin")) return role === "admin";
  if (pathname.startsWith("/supplier")) return role === "supplier";
  if (pathname.startsWith("/merchant")) return role === "merchant";
  return true;
}
