import Link from "next/link";
import { AdminDashboardCharts } from "@/components/admin/admin-dashboard-charts";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { AdminConsoleGraphic } from "@/components/illustrations/admin-console-graphic";
import { getAdminAnalytics } from "@/lib/db/admin-analytics";
import {
  HiOutlineArrowRight,
  HiOutlineBanknotes,
  HiOutlineBuildingOffice2,
  HiOutlineArrowTrendingUp,
  HiOutlineClipboardDocumentList,
  HiOutlineCog6Tooth,
  HiOutlineRectangleStack,
  HiOutlineShieldExclamation,
  HiOutlineUsers,
} from "react-icons/hi2";

const shortcuts = [
  {
    href: "/admin/moderation",
    label: "Moderation",
    description: "Reviews, comments, and takedowns",
    icon: HiOutlineShieldExclamation,
  },
  {
    href: "/admin/orders",
    label: "Orders",
    description: "Payments and fulfillment audit",
    icon: HiOutlineClipboardDocumentList,
  },
  {
    href: "/admin/categories",
    label: "Categories",
    description: "Taxonomy and browse filters",
    icon: HiOutlineRectangleStack,
  },
  {
    href: "/admin/companies",
    label: "Companies",
    description: "Supplier verification queue",
    icon: HiOutlineBuildingOffice2,
  },
  {
    href: "/admin/system",
    label: "System",
    description: "Commission, points, featured cost",
    icon: HiOutlineCog6Tooth,
  },
] as const;

export default function AdminDashboardPage() {
  const a = getAdminAnalytics();

  return (
    <div className="space-y-8 sm:space-y-10 lg:space-y-12">
      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_min(100%,380px)] lg:items-start lg:gap-10 xl:grid-cols-[minmax(0,1fr)_400px] xl:gap-14">
        <div className="min-w-0 space-y-6 sm:space-y-8">
          <div>
            <p className="lm-eyebrow">Operations</p>
            <h1 className="lm-heading-display text-balance">
              Admin control center
            </h1>
            <p className="lm-body-lead mt-3 max-w-2xl text-pretty">
              Verify suppliers, tune monetization, and keep the catalog healthy.
              Bootstrap the first admin with{" "}
              <code className="whitespace-nowrap rounded-md bg-base-200 px-1.5 py-0.5 text-[0.7rem] sm:text-xs">
                POST /api/auth/bootstrap-admin
              </code>{" "}
              and{" "}
              <code className="whitespace-nowrap rounded-md bg-base-200 px-1.5 py-0.5 text-[0.7rem] sm:text-xs">
                ADMIN_BOOTSTRAP_KEY
              </code>{" "}
              (see <code className="text-[0.7rem] sm:text-xs">env.example</code>
              ).
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-4 sm:gap-4">
            <AdminStatCard
              eyebrow="Users"
              value={a.userCount}
              footnote={
                <>
                  {a.merchantCount} merchants · {a.supplierCount} suppliers ·{" "}
                  {a.adminCount} admins
                </>
              }
              icon={HiOutlineUsers}
              accent="primary"
            />
            <AdminStatCard
              eyebrow="GMV (completed)"
              value={
                <>
                  {a.gmvCompletedEtb.toLocaleString()}{" "}
                  <span className="text-base font-semibold text-base-content/45 sm:text-lg">
                    ETB
                  </span>
                </>
              }
              footnote={<>{a.completedOrderCount} completed orders</>}
              icon={HiOutlineBanknotes}
              accent="secondary"
              valueSize="lg"
            />
            <AdminStatCard
              eyebrow="Commission"
              value={
                <>
                  {a.commissionCollectedEtb.toLocaleString()}{" "}
                  <span className="text-base font-semibold text-base-content/45 sm:text-lg">
                    ETB
                  </span>
                </>
              }
              footnote={<>From completed checkouts</>}
              icon={HiOutlineArrowTrendingUp}
              accent="success"
              valueSize="lg"
              valueClassName="text-success"
            />
            <AdminStatCard
              eyebrow="Pipeline"
              value={a.openOrderCount}
              footnote={
                <>
                  {a.ordersPendingPayment} awaiting payment · {a.orderCount}{" "}
                  orders total
                </>
              }
              icon={HiOutlineClipboardDocumentList}
              accent="warning"
              valueClassName="text-warning"
            />
          </div>
        </div>

        <div className="mx-auto w-full max-w-md shrink-0 lg:mx-0 lg:max-w-none lg:pt-1">
          <div className="rounded-2xl border border-base-300/80 bg-base-200/20 p-4 sm:p-5 lg:border-0 lg:bg-transparent lg:p-0">
            <AdminConsoleGraphic />
          </div>
        </div>
      </div>

      <section className="space-y-3 sm:space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-base-content sm:text-lg">
              Analytics
            </h2>
            <p className="text-sm text-base-content/60">
              Platform GMV, commission mix, and category concentration.
            </p>
          </div>
        </div>
        <AdminDashboardCharts
          ordersByStatus={a.ordersByStatus}
          gmvByMonth={a.gmvByMonth}
          topCategories={a.topCategories}
        />
      </section>

      <section className="space-y-3 sm:space-y-4">
        <div>
          <h2 className="text-base font-semibold text-base-content sm:text-lg">
            Shortcuts
          </h2>
          <p className="mt-0.5 text-sm text-base-content/60">
            Jump to common admin workflows.
          </p>
        </div>
        <ul className="flex flex-col gap-2 sm:grid sm:grid-cols-2 sm:gap-3 xl:grid-cols-3">
          {shortcuts.map((s) => {
            const Icon = s.icon;
            return (
              <li key={s.href} className="min-w-0">
                <Link
                  href={s.href}
                  className="group flex min-h-[4.25rem] w-full items-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm ring-1 ring-base-300/20 transition active:scale-[0.99] sm:min-h-0 sm:items-start sm:gap-4 sm:p-5 hover:border-primary/35 hover:bg-base-200/35 hover:ring-primary/15"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-base-200/90 text-primary transition group-hover:bg-primary/10 sm:h-12 sm:w-12">
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1 text-start">
                    <span className="flex items-center gap-1 font-semibold text-base-content">
                      <span className="truncate">{s.label}</span>
                      <HiOutlineArrowRight
                        className="h-4 w-4 shrink-0 opacity-40 transition group-hover:translate-x-0.5 group-hover:opacity-70"
                        aria-hidden
                      />
                    </span>
                    <span className="mt-0.5 block text-sm leading-snug text-base-content/55">
                      {s.description}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
