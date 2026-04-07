import { Suspense } from "react";
import { redirect } from "next/navigation";
import { defaultHomePath } from "@/lib/auth/portal-routes";
import {
  HiOutlineAdjustmentsHorizontal,
  HiOutlineBuildingOffice2,
  HiOutlineClipboardDocumentList,
  HiOutlineClock,
  HiOutlineCog6Tooth,
  HiOutlineFingerPrint,
  HiOutlineHome,
  HiOutlineRectangleStack,
  HiOutlineShieldExclamation,
  HiOutlineShieldCheck,
  HiOutlineUsers,
} from "react-icons/hi2";
import { isStaffAdminRole } from "@/lib/admin-staff";
import { PortalNoticeBanner } from "@/components/portal-notice-banner";
import { SidebarLayout } from "@/components/portal/sidebar-layout";
import { effectiveStaffPermissions } from "@/lib/server/admin-permissions";
import { getSessionUser } from "@/lib/server/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/admin/dashboard");
  }
  if (!isStaffAdminRole(user.role)) {
    redirect(`${defaultHomePath(user.role)}?notice=staff_only`);
  }

  const perms = effectiveStaffPermissions(user.id);
  const locked = user.role === "admin" && perms.length === 0;
  const canOrders =
    perms.includes("orders:admin") || perms.includes("orders:complete");

  const linkDefs: {
    href: string;
    label: string;
    icon: React.ReactNode;
    visible: boolean;
  }[] = [
    {
      href: "/admin/pending-access",
      label: "Access pending",
      icon: <HiOutlineClock className="h-5 w-5" />,
      visible: locked,
    },
    {
      href: "/admin/dashboard",
      label: "Overview",
      icon: <HiOutlineHome className="h-5 w-5" />,
      visible: !locked && perms.includes("admin:dashboard"),
    },
    {
      href: "/admin/orders",
      label: "Orders",
      icon: <HiOutlineClipboardDocumentList className="h-5 w-5" />,
      visible: !locked && canOrders,
    },
    {
      href: "/admin/verifications",
      label: "Verifications",
      icon: <HiOutlineFingerPrint className="h-5 w-5" />,
      visible: !locked && perms.includes("companies:verify"),
    },
    {
      href: "/admin/companies",
      label: "Companies",
      icon: <HiOutlineBuildingOffice2 className="h-5 w-5" />,
      visible: !locked && perms.includes("companies:verify"),
    },
    {
      href: "/admin/moderation",
      label: "Moderation",
      icon: <HiOutlineShieldExclamation className="h-5 w-5" />,
      visible: !locked && perms.includes("moderation:manage"),
    },
    {
      href: "/admin/categories",
      label: "Categories",
      icon: <HiOutlineRectangleStack className="h-5 w-5" />,
      visible: !locked && perms.includes("categories:manage"),
    },
    {
      href: "/admin/system",
      label: "System config",
      icon: <HiOutlineCog6Tooth className="h-5 w-5" />,
      visible: !locked && perms.includes("system:configure"),
    },
    {
      href: "/admin/admins",
      label: "Team & roles",
      icon: <HiOutlineUsers className="h-5 w-5" />,
      visible: !locked && perms.includes("system:manage-admins"),
    },
    {
      href: "/admin/audit",
      label: "Audit log",
      icon: <HiOutlineShieldCheck className="h-5 w-5" />,
      visible: !locked && perms.includes("system:audit-read"),
    },
    {
      href: "/admin/settings",
      label: "Settings",
      icon: <HiOutlineAdjustmentsHorizontal className="h-5 w-5" />,
      /** Every signed-in staff member can open account settings (not gated on admin:dashboard). */
      visible: true,
    },
  ];

  const links = linkDefs
    .filter((l) => l.visible)
    .map(({ href, label, icon }) => ({ href, label, icon }));

  const title =
    user.role === "system_admin" ? "System admin" : "Admin";

  return (
    <SidebarLayout
      title={title}
      links={links}
      contentMaxWidthClass="max-w-7xl"
      topBanner={
        <Suspense fallback={null}>
          <PortalNoticeBanner />
        </Suspense>
      }
    >
      {children}
    </SidebarLayout>
  );
}
