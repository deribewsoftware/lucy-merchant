import Link from "next/link"
import { redirect } from "next/navigation"
import {
  ArrowRight,
  Banknote,
  Building2,
  ClipboardList,
  Landmark,
  Package,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Plus,
  BarChart3,
} from "lucide-react"
import { PaginatedSupplierTopProducts } from "@/components/dashboard-paginated-lists"
import { SupplierDashboardCharts } from "@/components/supplier-dashboard-charts"
import { findUserById } from "@/lib/db/users"
import { companiesByOwner } from "@/lib/db/catalog"
import { getSupplierAnalytics } from "@/lib/db/supplier-analytics"
import { supplierHasOutstandingCommission } from "@/lib/server/supplier-commission"
import { getSessionUser } from "@/lib/server/session"

export default async function SupplierDashboardPage() {
  const user = await getSessionUser()
  if (user && supplierHasOutstandingCommission(user.id)) {
    redirect("/supplier/orders?hold=commission")
  }
  const row = user ? findUserById(user.id) : undefined
  const companies = user ? companiesByOwner(user.id) : []
  const verified = companies.filter((c) => c.isVerified).length
  const analytics = user ? getSupplierAnalytics(user.id) : null

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
    : null

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card via-primary/5 to-accent/5 p-6 sm:p-8">
        {/* Background decorations */}
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-accent/10 blur-2xl" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />
        
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-3 w-3" />
              Supplier Workspace
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Posting points:{" "}
              <strong className="text-foreground">{row?.points ?? 0}</strong>.
              Companies:{" "}
              <strong className="text-foreground">{companies.length}</strong> (
              {verified} verified). Listings require a verified company profile.
            </p>
            
            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/supplier/orders"
                className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-medium text-background shadow-lg transition-all hover:bg-foreground/90"
              >
                <ClipboardList className="h-4 w-4" />
                Orders Pipeline
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/supplier/products"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground shadow-sm transition-all hover:border-primary/50 hover:bg-primary/5"
              >
                <Package className="h-4 w-4 text-primary" />
                My Listings
              </Link>
              <Link
                href="/supplier/products/new"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
              >
                <Plus className="h-4 w-4" />
                Post Product
              </Link>
            </div>
          </div>

          {/* Performance card */}
          <div className="relative flex shrink-0 flex-col items-center justify-center rounded-2xl border border-border/50 bg-card/80 px-8 py-6 shadow-lg backdrop-blur-sm">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <p className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Performance Pulse
            </p>
            <p className="mt-2 text-center text-2xl font-bold text-foreground">
              {analytics?.completedOrdersCount || 0}
              <span className="ml-1 text-sm font-normal text-muted-foreground">orders</span>
            </p>
            <p className="mt-1 text-center text-xs text-muted-foreground">
              Charts reflect your SKUs only
            </p>
          </div>
        </div>
      </section>

      {analytics && (
        <>
          {/* Key Metrics */}
          <section>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Key Metrics</h2>
                <p className="text-sm text-muted-foreground">
                  Revenue and supplier platform fees on completed orders
                </p>
              </div>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {/* Completed Revenue */}
              <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 p-5 shadow-sm transition-all duration-300 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                    <Banknote className="h-6 w-6 text-accent" />
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Completed Revenue
                  </p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                    {analytics.completedRevenueEtb.toLocaleString()}
                    <span className="ml-1 text-sm font-medium text-muted-foreground">ETB</span>
                  </p>
                </div>
              </div>

              {/* Completed Orders */}
              <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 p-5 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <ShoppingCart className="h-6 w-6 text-primary" />
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Completed Orders
                  </p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                    {analytics.completedOrdersCount}
                  </p>
                </div>
              </div>

              {/* Supplier platform fees (completed orders) */}
              <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 p-5 shadow-sm transition-all duration-300 hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/5">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10">
                    <Landmark className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Platform fees (completed)
                  </p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-violet-700 dark:text-violet-300">
                    {analytics.completedSupplierPlatformFeesEtb.toLocaleString()}
                    <span className="ml-1 text-sm font-medium text-muted-foreground">ETB</span>
                  </p>
                  <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                    Supplier share on settled orders
                  </p>
                </div>
              </div>

              {/* Open Pipeline */}
              <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 p-5 shadow-sm transition-all duration-300 hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
                    <ClipboardList className="h-6 w-6 text-amber-500" />
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Open Pipeline
                  </p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-amber-500">
                    {analytics.openOrdersCount}
                  </p>
                </div>
              </div>

              {/* Companies */}
              <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 p-5 shadow-sm transition-all duration-300 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/5">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
                    <Building2 className="h-6 w-6 text-purple-500" />
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Companies
                  </p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                    {analytics.companyCount}
                    <span className="ml-2 text-sm font-medium text-muted-foreground">
                      ({analytics.verifiedCompanyCount} verified)
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Analytics Charts */}
          <section>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Analytics</h2>
                <p className="text-sm text-muted-foreground">
                  Interactive charts showing revenue trends and pipeline mix
                </p>
              </div>
            </div>
            
            <div className="rounded-2xl border border-border/50 bg-card/80 p-6 shadow-sm">
              {chartPayload && <SupplierDashboardCharts data={chartPayload} />}
            </div>
          </section>

          {/* Top Products */}
          {analytics.topProducts.length > 0 && (
            <section>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Top Products</h2>
                  <p className="text-sm text-muted-foreground">
                    Your best performing SKUs by revenue
                  </p>
                </div>
              </div>
              
              <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/80 shadow-sm">
                <PaginatedSupplierTopProducts
                  items={analytics.topProducts.map((p, i) => ({
                    rank: i + 1,
                    productId: p.productId,
                    name: p.name,
                    revenueEtb: p.revenueEtb,
                    unitsSold: p.unitsSold,
                  }))}
                />
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
