import type { UserRole } from "@/lib/domain/types";

/** Default home path after sign-in for a role (and optional locked-admin state). */
export function defaultHomePath(
  role: UserRole,
  options?: { adminAccessPending?: boolean },
): string {
  if (
    options?.adminAccessPending &&
    (role === "admin" || role === "system_admin")
  ) {
    return "/admin/pending-access";
  }
  if (role === "admin" || role === "system_admin") return "/admin/dashboard";
  if (role === "supplier") return "/supplier/dashboard";
  return "/merchant/dashboard";
}

/** Human label for a URL prefix (login / help copy). */
export function portalAreaLabel(pathname: string): string {
  if (pathname.startsWith("/admin")) return "Admin & staff";
  if (pathname.startsWith("/supplier")) return "Supplier";
  if (pathname.startsWith("/merchant")) return "Merchant";
  if (pathname.startsWith("/notifications")) return "Notifications";
  return "That area";
}

export const PORTAL_ACCESS_ROWS: {
  prefix: string;
  title: string;
  roles: string;
  description: string;
}[] = [
  {
    prefix: "/admin",
    title: "Admin workspace",
    roles: "Administrator, system administrator",
    description: "Operations, orders, verifications, moderation, system settings (by permission).",
  },
  {
    prefix: "/supplier",
    title: "Supplier workspace",
    roles: "Supplier",
    description: "Companies, products, supplier orders, payouts.",
  },
  {
    prefix: "/merchant",
    title: "Merchant workspace",
    roles: "Merchant",
    description: "Browse, cart, buyer orders, reviews.",
  },
  {
    prefix: "/notifications",
    title: "Notifications",
    roles: "Any signed-in role",
    description: "Order and account alerts shared across roles.",
  },
];
