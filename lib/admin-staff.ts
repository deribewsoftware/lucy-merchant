import type { UserRole } from "@/lib/domain/types";

export const ADMIN_STAFF_ROLES: UserRole[] = ["admin", "system_admin"];

/** Merchant, supplier, or any staff admin (admin / system_admin). */
export const MERCHANT_SUPPLIER_STAFF_ROLES: UserRole[] = [
  "merchant",
  "supplier",
  "admin",
  "system_admin",
];

export function isStaffAdminRole(role: UserRole): boolean {
  return role === "admin" || role === "system_admin";
}

/** User-facing role label (header, profile chips — not raw enum strings). */
export function roleDisplayLabel(role: UserRole): string {
  switch (role) {
    case "system_admin":
      return "System admin";
    case "admin":
      return "Admin";
    case "merchant":
      return "Merchant";
    case "supplier":
      return "Supplier";
    default:
      return role;
  }
}
