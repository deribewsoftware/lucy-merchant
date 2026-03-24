import { redirect } from "next/navigation";
import {
  HiOutlineBuildingOffice2,
  HiOutlineChartBarSquare,
  HiOutlineClipboardDocumentList,
  HiOutlineCube,
  HiOutlinePlusCircle,
} from "react-icons/hi2";
import { SidebarLayout } from "@/components/portal/sidebar-layout";
import { getSessionUser } from "@/lib/server/session";

export default async function SupplierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user || user.role !== "supplier") {
    redirect("/login?next=/supplier/dashboard");
  }

  const links = [
    {
      href: "/supplier/dashboard",
      label: "Overview",
      icon: <HiOutlineChartBarSquare className="h-5 w-5" />,
    },
    {
      href: "/supplier/companies",
      label: "Companies",
      icon: <HiOutlineBuildingOffice2 className="h-5 w-5" />,
    },
    {
      href: "/supplier/products",
      label: "My listings",
      icon: <HiOutlineCube className="h-5 w-5" />,
    },
    {
      href: "/supplier/products/new",
      label: "Post product",
      icon: <HiOutlinePlusCircle className="h-5 w-5" />,
    },
    {
      href: "/supplier/orders",
      label: "Orders",
      icon: <HiOutlineClipboardDocumentList className="h-5 w-5" />,
    },
  ];

  return (
    <SidebarLayout title="Supplier" links={links}>
      {children}
    </SidebarLayout>
  );
}
