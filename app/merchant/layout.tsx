import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import {
  HiOutlineClipboardDocumentList,
  HiOutlineCog6Tooth,
  HiOutlinePresentationChartLine,
  HiOutlineShoppingBag,
  HiOutlineShieldCheck,
} from "react-icons/hi2";
import { PortalNoticeBanner } from "@/components/portal-notice-banner";
import { SidebarLayout } from "@/components/portal/sidebar-layout";
import { MERCHANT_COMMISSION_SUSPENSION_BANNER } from "@/lib/domain/commission-hold-copy";
import { merchantHasOutstandingCommission } from "@/lib/server/merchant-commission";
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

  const commissionHold = merchantHasOutstandingCommission(user.id);

  const links = [
    {
      href: "/merchant/dashboard",
      label: "Overview",
      icon: <HiOutlinePresentationChartLine className="h-5 w-5" />,
    },
    {
      href: "/merchant/verification",
      label: "Verification",
      icon: <HiOutlineShieldCheck className="h-5 w-5" />,
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
    {
      href: "/merchant/settings",
      label: "Settings",
      icon: <HiOutlineCog6Tooth className="h-5 w-5" />,
    },
  ];

  return (
    <SidebarLayout
      title="Merchant"
      links={links}
      topBanner={
        <>
          <Suspense fallback={null}>
            <PortalNoticeBanner />
          </Suspense>
          {commissionHold ? (
            <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="min-w-0 flex-1 text-sm text-foreground">
                {MERCHANT_COMMISSION_SUSPENSION_BANNER}
              </p>
              <Link
                href="/merchant/orders"
                className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
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
