import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { defaultHomePath } from "@/lib/auth/portal-routes";
import { AlertTriangle } from "lucide-react";
import {
  HiOutlineBuildingOffice2,
  HiOutlineChartBarSquare,
  HiOutlineClipboardDocumentList,
  HiOutlineCog6Tooth,
  HiOutlineCube,
  HiOutlinePlusCircle,
  HiOutlineShieldCheck,
} from "react-icons/hi2";
import { PortalNoticeBanner } from "@/components/portal-notice-banner";
import { SidebarLayout } from "@/components/portal/sidebar-layout";
import { SUPPLIER_COMMISSION_SUSPENSION_BANNER } from "@/lib/domain/commission-hold-copy";
import { supplierHasOutstandingCommission } from "@/lib/server/supplier-commission";
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

  const commissionHold = supplierHasOutstandingCommission(user.id);

  const links = [
    {
      href: "/supplier/dashboard",
      label: "Overview",
      icon: <HiOutlineChartBarSquare className="h-5 w-5" />,
    },
    {
      href: "/supplier/verification",
      label: "Verification",
      icon: <HiOutlineShieldCheck className="h-5 w-5" />,
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
    {
      href: "/supplier/settings",
      label: "Settings",
      icon: <HiOutlineCog6Tooth className="h-5 w-5" />,
    },
  ];

  return (
    <SidebarLayout
      title="Supplier"
      links={links}
      topBanner={
        <>
          <Suspense fallback={null}>
            <PortalNoticeBanner />
          </Suspense>
          {commissionHold ? (
            <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="min-w-0 flex-1 text-sm text-base-content">
                {SUPPLIER_COMMISSION_SUSPENSION_BANNER}
              </p>
              <Link
                href="/supplier/orders"
                className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-content transition hover:bg-primary/90"
              >
                Open orders
              </Link>
            </div>
          ) : null}
        </>
      }
    >
      {children}
    </SidebarLayout>
  );
}
