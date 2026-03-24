import Link from "next/link";
import {
  HiArrowRight,
  HiOutlineBanknotes,
  HiOutlineBuildingOffice2,
  HiOutlineClipboardDocumentList,
  HiOutlineCube,
  HiOutlineShoppingCart,
} from "react-icons/hi2";
import { SupplierDashboardCharts } from "@/components/supplier-dashboard-charts";
import {
  SupplierAnalyticsSparkline,
  SupplierHeroBackdrop,
} from "@/components/supplier/supplier-portal-graphics";
import { findUserById } from "@/lib/db/users";
import { companiesByOwner } from "@/lib/db/catalog";
import { getSupplierAnalytics } from "@/lib/db/supplier-analytics";
import { getSessionUser } from "@/lib/server/session";

export default async function SupplierDashboardPage() {
  const user = await getSessionUser();
  const row = user ? findUserById(user.id) : undefined;
  const companies = user ? companiesByOwner(user.id) : [];
  const verified = companies.filter((c) => c.isVerified).length;
  const analytics = user ? getSupplierAnalytics(user.id) : null;

  const chartPayload = analytics
    ? {
        ordersByStatus: analytics.ordersByStatus,
        revenueByMonth: analytics.revenueByMonth,
        topProducts: analytics.topProducts.map((p) => ({
          name: p.name,
          revenueEtb: p.revenueEtb,
          unitsSold: p.unitsSold,
        })),
      }
    : null;

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-2xl border border-base-300 bg-gradient-to-br from-base-100 via-primary/[0.04] to-secondary/[0.08] p-6 shadow-sm ring-1 ring-base-300/30 sm:p-8">
        <SupplierHeroBackdrop />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Supplier workspace
            </p>
            <h1 className="font-display text-2xl font-bold tracking-tight text-base-content sm:text-3xl">
              Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
            </h1>
            <p className="text-sm leading-relaxed text-base-content/70">
              Posting points:{" "}
              <strong className="text-base-content">{row?.points ?? 0}</strong>.
              Companies:{" "}
              <strong className="text-base-content">{companies.length}</strong> (
              {verified} verified). Listings require a verified company profile.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Link
                href="/supplier/orders"
                className="btn btn-neutral btn-sm gap-2 rounded-xl border-0 sm:btn-md"
              >
                <HiOutlineClipboardDocumentList className="h-4 w-4" />
                Orders pipeline
                <HiArrowRight className="h-4 w-4 opacity-80" />
              </Link>
              <Link
                href="/supplier/products"
                className="btn btn-outline btn-sm gap-2 rounded-xl border-base-300 sm:btn-md"
              >
                <HiOutlineCube className="h-4 w-4 text-primary" />
                My listings
              </Link>
              <Link
                href="/supplier/products/new"
                className="btn btn-primary btn-sm gap-2 rounded-xl sm:btn-md"
              >
                Post a product
                <HiArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="relative flex shrink-0 flex-col items-center justify-center rounded-2xl border border-base-300 bg-base-100/80 px-8 py-6 shadow-inner backdrop-blur-sm">
            <SupplierAnalyticsSparkline className="mb-2 h-10 w-32" />
            <p className="text-center text-[11px] font-medium uppercase tracking-wider text-base-content/50">
              Performance pulse
            </p>
            <p className="mt-1 text-center text-xs text-base-content/60">
              Charts below reflect your SKUs only
            </p>
          </div>
        </div>
      </section>

      {analytics && (
        <>
          <section>
            <h2 className="text-lg font-semibold text-base-content">Key metrics</h2>
            <p className="mt-1 text-sm text-base-content/60">
              Revenue counts only your line items on completed orders (multi-supplier
              carts).
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="group relative overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm ring-1 ring-base-300/20">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
                  <HiOutlineBanknotes className="h-5 w-5" />
                </span>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-base-content/50">
                  Completed revenue
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-base-content">
                  {analytics.completedRevenueEtb.toLocaleString()}{" "}
                  <span className="text-base font-medium text-base-content/50">
                    ETB
                  </span>
                </p>
              </div>
              <div className="group relative overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm ring-1 ring-base-300/20">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <HiOutlineShoppingCart className="h-5 w-5" />
                </span>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-base-content/50">
                  Completed orders
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-base-content">
                  {analytics.completedOrdersCount}
                </p>
              </div>
              <div className="group relative overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm ring-1 ring-base-300/20">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 text-warning">
                  <HiOutlineClipboardDocumentList className="h-5 w-5" />
                </span>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-base-content/50">
                  Open pipeline
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-warning">
                  {analytics.openOrdersCount}
                </p>
              </div>
              <div className="group relative overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm ring-1 ring-base-300/20">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                  <HiOutlineBuildingOffice2 className="h-5 w-5" />
                </span>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-base-content/50">
                  Companies
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-base-content">
                  {analytics.companyCount}
                  <span className="ml-1 text-sm font-medium text-base-content/50">
                    ({analytics.verifiedCompanyCount} verified)
                  </span>
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-base-content">Analytics</h2>
            <p className="mt-1 text-sm text-base-content/60">
              Interactive charts — revenue trend, pipeline mix, and top performers.
              Colors follow your selected site theme.
            </p>
            <div className="mt-5">
              {chartPayload && <SupplierDashboardCharts data={chartPayload} />}
            </div>
          </section>

          {analytics.topProducts.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-base-content">
                Top SKUs (detail)
              </h2>
              <ul className="mt-4 divide-y divide-base-300 rounded-2xl border border-base-300 bg-base-100 shadow-sm">
                {analytics.topProducts.map((p) => (
                  <li
                    key={p.productId}
                    className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 text-sm transition hover:bg-base-200/40"
                  >
                    <Link
                      href={`/products/${p.productId}`}
                      className="link link-hover font-medium text-primary no-underline"
                    >
                      {p.name}
                    </Link>
                    <span className="text-base-content/60">
                      {p.revenueEtb.toLocaleString()} ETB · {p.unitsSold} units
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
