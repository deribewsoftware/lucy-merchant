import { redirect } from "next/navigation";
import {
  HiOutlineClipboardDocumentList,
  HiOutlineMagnifyingGlass,
  HiOutlinePresentationChartLine,
  HiOutlineShoppingBag,
} from "react-icons/hi2";
import { SidebarLayout } from "@/components/portal/sidebar-layout";
import { getSessionUser } from "@/lib/server/session";

export default async function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user || user.role !== "merchant") {
    redirect("/login?next=/merchant/dashboard");
  }

  const links = [
    {
      href: "/merchant/dashboard",
      label: "Overview",
      icon: <HiOutlinePresentationChartLine className="h-5 w-5" />,
    },
    {
      href: "/browse",
      label: "Browse",
      icon: <HiOutlineMagnifyingGlass className="h-5 w-5" />,
    },
    {
      href: "/merchant/cart",
      label: "Cart",
      icon: <HiOutlineShoppingBag className="h-5 w-5" />,
    },
    {
      href: "/merchant/orders",
      label: "Orders",
      icon: <HiOutlineClipboardDocumentList className="h-5 w-5" />,
    },
  ];

  return (
    <SidebarLayout title="Merchant" links={links}>
      {children}
    </SidebarLayout>
  );
}
