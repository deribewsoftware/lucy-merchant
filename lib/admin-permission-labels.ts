import type { Permission } from "@/lib/domain/types";

/** Human-readable labels for staff permission keys (Team & roles UI). */
export const STAFF_PERMISSION_LABELS: Partial<
  Record<Permission, { title: string; description: string; group: string }>
> = {
  "admin:dashboard": {
    title: "Dashboard",
    description: "Overview and analytics home",
    group: "Core",
  },
  "companies:verify": {
    title: "Companies & verifications",
    description: "Review supplier companies and identity checks",
    group: "Operations",
  },
  "categories:manage": {
    title: "Categories",
    description: "Manage catalog categories",
    group: "Catalog",
  },
  "system:configure": {
    title: "System configuration",
    description: "Platform settings and configuration",
    group: "Platform",
  },
  "orders:complete": {
    title: "Complete orders",
    description: "Mark orders complete and finalize flows",
    group: "Orders",
  },
  "moderation:manage": {
    title: "Moderation",
    description: "Reviews, comments, and content moderation",
    group: "Trust & safety",
  },
  "orders:admin": {
    title: "Orders (admin)",
    description: "View and manage orders across the marketplace",
    group: "Orders",
  },
  "system:manage-admins": {
    title: "Team & roles",
    description: "Invite admins and assign permissions",
    group: "Platform",
  },
  "system:audit-read": {
    title: "Audit log",
    description: "Read administrative audit history",
    group: "Platform",
  },
};
