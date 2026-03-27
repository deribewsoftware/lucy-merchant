import { redirect } from "next/navigation";
import {
  HiOutlineBuildingOffice2,
  HiOutlineClipboardDocumentList,
  HiOutlineCog6Tooth,
  HiOutlineFingerPrint,
  HiOutlineHome,
  HiOutlineRectangleStack,
  HiOutlineShieldExclamation,
} from "react-icons/hi2";
import { SidebarLayout } from "@/components/portal/sidebar-layout";
import { getSessionUser } from "@/lib/server/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    redirect("/login?next=/admin/dashboard");
  }

  const links = [
    {
      href: "/admin/dashboard",
      label: "Overview",
      icon: <HiOutlineHome className="h-5 w-5" />,
    },
    {
      href: "/admin/orders",
      label: "Orders",
      icon: <HiOutlineClipboardDocumentList className="h-5 w-5" />,
    },
    {
      href: "/admin/verifications",
      label: "Verifications",
      icon: <HiOutlineFingerPrint className="h-5 w-5" />,
    },
    {
      href: "/admin/companies",
      label: "Companies",
      icon: <HiOutlineBuildingOffice2 className="h-5 w-5" />,
    },
    {
      href: "/admin/moderation",
      label: "Moderation",
      icon: <HiOutlineShieldExclamation className="h-5 w-5" />,
    },
    {
      href: "/admin/categories",
      label: "Categories",
      icon: <HiOutlineRectangleStack className="h-5 w-5" />,
    },
    {
      href: "/admin/system",
      label: "System config",
      icon: <HiOutlineCog6Tooth className="h-5 w-5" />,
    },
  ];

  return (
    <SidebarLayout title="Admin" links={links} contentMaxWidthClass="max-w-7xl">
      {children}
    </SidebarLayout>
  );
}
