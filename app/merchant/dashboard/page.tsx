import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ClipboardList,
  Package,
  Search,
  ShoppingCart,
  TrendingUp,
  Truck,
  Wallet,
} from "lucide-react";
import { MerchantDashboardCharts } from "@/components/merchant-dashboard-charts";
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

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <section className="lm-card relative overflow-hidden bg-gradient-to-br from-primary/5 via-card to-accent/5 p-6 sm:p-8">
        <div className="absolute inset-0 lm-grid-pattern opacity-50" />
        <div className="relative">
          <span className="lm-eyebrow">Merchant Dashboard</span>
          <h1 className="lm-heading-section mt-2">
            Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Manage your orders, browse products, and track your spending. Your one-stop hub for all procurement activities.
          </p>
          
          {/* Quick Actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/browse"
              className="group flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90"
            >
              <Search className="h-4 w-4" />
              Browse Catalog
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/merchant/cart"
              className="flex h-11 items-center gap-2 rounded-lg border border-border bg-card px-5 text-sm font-medium text-foreground transition-all hover:border-primary/30 hover:bg-muted"
            >
              <ShoppingCart className="h-4 w-4" />
              View Cart
              {cartLines > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  {cartLines}
                </span>
              )}
            </Link>
            <Link
              href="/merchant/orders"
              className="flex h-11 items-center gap-2 rounded-lg border border-border bg-card px-5 text-sm font-medium text-foreground transition-all hover:border-primary/30 hover:bg-muted"
            >
              <ClipboardList className="h-4 w-4" />
              Orders
            </Link>
          </div>
        </div>
      </section>

      {analytics && (
        <>
          {/* Stats Grid */}
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">Key Metrics</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Track your spending and order activity
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="lm-card lm-card-hover">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-success/10 text-success">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Completed Spend</p>
                    <p className="text-2xl font-bold text-foreground">
                      {analytics.completedSpendEtb.toLocaleString()}
                      <span className="ml-1 text-sm font-normal text-muted-foreground">ETB</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="lm-card lm-card-hover">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-warning/10 text-warning">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Open Pipeline</p>
                    <p className="text-2xl font-bold text-warning">{openOrders}</p>
                  </div>
                </div>
              </div>

              <div className="lm-card lm-card-hover">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ShoppingCart className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cart Items</p>
                    <p className="text-2xl font-bold text-foreground">{cartLines}</p>
                  </div>
                </div>
                <Link
                  href="/merchant/cart"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                >
                  Go to cart
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="lm-card lm-card-hover">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-info/10 text-info">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                    <p className="text-2xl font-bold text-foreground">{orders.length}</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Commission: {analytics.completedCommissionEtb.toLocaleString()} ETB
                </p>
              </div>
            </div>
          </section>

          {/* Analytics Charts */}
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">Analytics</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Procurement trends, status distribution, and spending breakdown
            </p>
            <div className="mt-4">
              <MerchantDashboardCharts data={analytics.charts} />
            </div>
          </section>

          {/* Top SKUs */}
          {analytics.charts.topLines.length > 0 && (
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">Top Products</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your most frequently ordered items
              </p>
              <div className="mt-4 lm-card p-0">
                <div className="divide-y divide-border">
                  {analytics.charts.topLines.map((line, i) => (
                    <Link
                      key={line.productId}
                      href={`/products/${line.productId}`}
                      className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-muted-foreground">
                          {i + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-primary" />
                          <span className="font-medium text-foreground">{line.name}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">
                          {line.spendEtb.toLocaleString()} ETB
                        </p>
                        <p className="text-sm text-muted-foreground">{line.units} units</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* Recent Orders */}
      {orders.length > 0 && (
        <section>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">Recent Orders</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your latest order activity
              </p>
            </div>
            <Link
              href="/merchant/orders"
              className="group flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              View all
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {orders.slice(0, 6).map((o) => (
              <Link
                key={o.id}
                href={`/merchant/orders/${o.id}`}
                className="lm-card lm-card-interactive"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    {o.id.slice(0, 12)}...
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                      o.status === "completed"
                        ? "bg-success/15 text-success"
                        : o.status === "rejected"
                          ? "bg-destructive/15 text-destructive"
                          : o.status === "delivered"
                            ? "bg-info/15 text-info"
                            : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {o.status.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-3 text-xl font-bold text-primary">
                  {o.totalPrice.toLocaleString()} ETB
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {o.deliveryLocation}
                </p>
                <div className="mt-3 flex items-center gap-1 text-sm text-primary">
                  <TrendingUp className="h-4 w-4" />
                  View details
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
