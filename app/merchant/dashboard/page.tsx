import Link from "next/link";
import {
  HiArrowRight,
  HiOutlineClipboardDocumentList,
  HiOutlineCube,
  HiOutlineMagnifyingGlass,
  HiOutlineReceiptPercent,
  HiOutlineShoppingCart,
  HiOutlineTruck,
} from "react-icons/hi2";
import { MerchantDashboardCharts } from "@/components/merchant-dashboard-charts";
import {
  MerchantHeroBackdrop,
  MerchantSpendSparkline,
} from "@/components/merchant/merchant-portal-graphics";
import { getProduct } from "@/lib/db/catalog";
import { getCart, ordersForMerchant } from "@/lib/db/commerce";
import { getMerchantDashboardAnalytics } from "@/lib/merchant-analytics";
import { getSessionUser } from "@/lib/server/session";

export default async function MerchantDashboardPage() {
  const user = await getSessionUser();
  const orders = user ? ordersForMerchant(user.id) : [];
  const cart = user ? getCart(user.id) : null;
  const cartLines = cart?.items.length ?? 0;

  const analytics = user
    ? getMerchantDashboardAnalytics(orders, (id) => getProduct(id)?.name ?? id)
    : null;

  const openOrders =
    orders.filter((o) => o.status !== "completed" && o.status !== "rejected")
      .length;

  const statCard =
    "group relative overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm ring-1 ring-base-300/20 transition hover:ring-primary/20";

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-2xl border border-base-300 bg-gradient-to-br from-base-100 via-secondary/[0.06] to-primary/[0.06] p-6 shadow-sm ring-1 ring-base-300/30 sm:p-8">
        <MerchantHeroBackdrop />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
              Merchant workspace
            </p>
            <h1 className="font-display text-2xl font-bold tracking-tight text-base-content sm:text-3xl">
              Welcome back
              {user?.name ? `, ${user.name.split(" ")[0]}` : ""}
            </h1>
            <p className="text-sm leading-relaxed text-base-content/70">
              Signed in as{" "}
              <strong className="text-base-content">{user?.name}</strong> (
              {user?.email}). Browse the catalog, check out in bulk from your
              cart, and follow every order through delivery and reviews.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Link
                href="/browse"
                className="btn btn-neutral btn-sm gap-2 rounded-xl border-0 sm:btn-md"
              >
                <HiOutlineMagnifyingGlass className="h-4 w-4" />
                Browse catalog
                <HiArrowRight className="h-4 w-4 opacity-80" />
              </Link>
              <Link
                href="/merchant/cart"
                className="btn btn-outline btn-sm gap-2 rounded-xl border-base-300 sm:btn-md"
              >
                <HiOutlineShoppingCart className="h-4 w-4 text-secondary" />
                Open cart
              </Link>
              <Link
                href="/merchant/orders"
                className="btn btn-secondary btn-sm gap-2 rounded-xl sm:btn-md"
              >
                Order pipeline
                <HiArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="relative flex shrink-0 flex-col items-center justify-center rounded-2xl border border-base-300 bg-base-100/80 px-8 py-6 shadow-inner backdrop-blur-sm">
            <MerchantSpendSparkline className="mb-2 h-10 w-32" />
            <p className="text-center text-[11px] font-medium uppercase tracking-wider text-base-content/50">
              Spend pulse
            </p>
            <p className="mt-1 text-center text-xs text-base-content/60">
              Six-month trend & SKU mix below
            </p>
          </div>
        </div>
      </section>

      {analytics && (
        <>
          <section>
            <h2 className="text-lg font-semibold text-base-content">
              Key metrics
            </h2>
            <p className="mt-1 text-sm text-base-content/60">
              Completed spend and commission reflect orders you have marked
              finished; pipeline counts active statuses.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className={statCard}>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
                  <HiOutlineReceiptPercent className="h-5 w-5" />
                </span>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-base-content/50">
                  Completed spend
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-base-content">
                  {analytics.completedSpendEtb.toLocaleString()}{" "}
                  <span className="text-base font-medium text-base-content/50">
                    ETB
                  </span>
                </p>
              </div>
              <div className={statCard}>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 text-warning">
                  <HiOutlineTruck className="h-5 w-5" />
                </span>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-base-content/50">
                  Open pipeline
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-warning">
                  {openOrders}
                </p>
              </div>
              <div className={statCard}>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <HiOutlineShoppingCart className="h-5 w-5" />
                </span>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-base-content/50">
                  Cart lines
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-base-content">
                  {cartLines}
                </p>
                <Link
                  href="/merchant/cart"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Go to cart
                  <HiArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className={statCard}>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                  <HiOutlineClipboardDocumentList className="h-5 w-5" />
                </span>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-base-content/50">
                  Total orders
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-base-content">
                  {orders.length}
                </p>
                <p className="mt-1 text-xs text-base-content/50">
                  Commission (completed):{" "}
                  {analytics.completedCommissionEtb.toLocaleString()} ETB
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-base-content">
              Analytics
            </h2>
            <p className="mt-1 text-sm text-base-content/60">
              Interactive charts — procurement trend, status mix, and where you
              concentrate spend. Colors follow your theme.
            </p>
            <div className="mt-5">
              <MerchantDashboardCharts data={analytics.charts} />
            </div>
          </section>

          {analytics.charts.topLines.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-base-content">
                Top SKUs (detail)
              </h2>
              <ul className="mt-4 divide-y divide-base-300 rounded-2xl border border-base-300 bg-base-100 shadow-sm">
                {analytics.charts.topLines.map((line) => (
                  <li
                    key={line.productId}
                    className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 text-sm transition hover:bg-base-200/40"
                  >
                    <Link
                      href={`/products/${line.productId}`}
                      className="link link-hover flex items-center gap-2 font-medium text-primary no-underline"
                    >
                      <HiOutlineCube className="h-4 w-4 shrink-0 text-secondary" />
                      {line.name}
                    </Link>
                    <span className="text-base-content/60">
                      {line.spendEtb.toLocaleString()} ETB · {line.units} units
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {orders.length > 0 && (
        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-base-content">
                Recent orders
              </h2>
              <p className="mt-1 text-sm text-base-content/60">
                Latest activity — open a row for chat, payments, and reviews.
              </p>
            </div>
            <Link
              href="/merchant/orders"
              className="btn btn-ghost btn-sm gap-1 rounded-xl text-primary"
            >
              View all
              <HiArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {orders.slice(0, 6).map((o) => (
              <li key={o.id}>
                <Link
                  href={`/merchant/orders/${o.id}`}
                  className="flex flex-col rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm ring-1 ring-base-300/15 transition hover:border-primary/30 hover:ring-primary/10"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs text-base-content/50">
                      {o.id.slice(0, 10)}…
                    </span>
                    <span
                      className={`badge badge-sm whitespace-nowrap capitalize ${
                        o.status === "completed"
                          ? "badge-success"
                          : o.status === "rejected"
                            ? "badge-error"
                            : o.status === "delivered"
                              ? "badge-info"
                              : "badge-ghost border border-base-300"
                      }`}
                    >
                      {o.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="mt-3 text-lg font-bold text-primary">
                    {o.totalPrice.toLocaleString()} ETB
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-base-content/55">
                    {o.deliveryLocation}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
