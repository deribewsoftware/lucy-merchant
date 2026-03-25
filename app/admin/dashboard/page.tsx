import Link from "next/link"
import { AdminDashboardCharts } from "@/components/admin/admin-dashboard-charts"
import { getAdminAnalytics } from "@/lib/db/admin-analytics"
import {
  ArrowRight,
  Banknote,
  Building2,
  TrendingUp,
  ClipboardList,
  Settings,
  Layers,
  ShieldAlert,
  Users,
  Sparkles,
  BarChart3,
  Zap,
} from "lucide-react"

const shortcuts = [
  {
    href: "/admin/moderation",
    label: "Moderation",
    description: "Reviews, comments, and takedowns",
    icon: ShieldAlert,
    color: "text-red-500 bg-red-500/10",
  },
  {
    href: "/admin/orders",
    label: "Orders",
    description: "Payments and fulfillment audit",
    icon: ClipboardList,
    color: "text-blue-500 bg-blue-500/10",
  },
  {
    href: "/admin/categories",
    label: "Categories",
    description: "Taxonomy and browse filters",
    icon: Layers,
    color: "text-purple-500 bg-purple-500/10",
  },
  {
    href: "/admin/companies",
    label: "Companies",
    description: "Supplier verification queue",
    icon: Building2,
    color: "text-amber-500 bg-amber-500/10",
  },
  {
    href: "/admin/system",
    label: "System",
    description: "Commission, points, featured cost",
    icon: Settings,
    color: "text-slate-500 bg-slate-500/10",
  },
] as const

export default function AdminDashboardPage() {
  const a = getAdminAnalytics()

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card via-primary/5 to-accent/5 p-6 sm:p-8">
        {/* Background decorations */}
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-accent/10 blur-2xl" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />
        
        <div className="relative">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-3 w-3" />
              Operations
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Admin Control Center
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Verify suppliers, tune monetization, and keep the catalog healthy.
              Bootstrap the first admin with{" "}
              <code className="whitespace-nowrap rounded-md bg-muted px-1.5 py-0.5 text-xs">
                POST /api/auth/bootstrap-admin
              </code>{" "}
              and{" "}
              <code className="whitespace-nowrap rounded-md bg-muted px-1.5 py-0.5 text-xs">
                ADMIN_BOOTSTRAP_KEY
              </code>
            </p>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Users */}
        <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 p-5 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Users
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              {a.userCount}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {a.merchantCount} merchants, {a.supplierCount} suppliers, {a.adminCount} admins
            </p>
          </div>
        </div>

        {/* GMV */}
        <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 p-5 shadow-sm transition-all duration-300 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
              <Banknote className="h-6 w-6 text-accent" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              GMV (Completed)
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              {a.gmvCompletedEtb.toLocaleString()}
              <span className="ml-1 text-sm font-medium text-muted-foreground">ETB</span>
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {a.completedOrderCount} completed orders
            </p>
          </div>
        </div>

        {/* Commission */}
        <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 p-5 shadow-sm transition-all duration-300 hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/5">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Platform fees (completed)
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-green-500">
              {a.commissionCollectedEtb.toLocaleString()}
              <span className="ml-1 text-sm font-medium text-muted-foreground">ETB</span>
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Buyer {a.commissionBuyerCollectedEtb.toLocaleString()} · Supplier{" "}
              {a.commissionSupplierCollectedEtb.toLocaleString()} ETB
            </p>
          </div>
        </div>

        {/* Pipeline */}
        <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 p-5 shadow-sm transition-all duration-300 hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
              <ClipboardList className="h-6 w-6 text-amber-500" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pipeline
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-amber-500">
              {a.openOrderCount}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {a.ordersPendingPayment} awaiting payment, {a.orderCount} total
            </p>
          </div>
        </div>
      </section>

      {/* Analytics Section */}
      <section>
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
            <BarChart3 className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Analytics</h2>
            <p className="text-sm text-muted-foreground">
              Platform GMV, fee trends, and category concentration
            </p>
          </div>
        </div>
        
        <div className="rounded-2xl border border-border/50 bg-card/80 p-6 shadow-sm">
          <AdminDashboardCharts
            ordersByStatus={a.ordersByStatus}
            gmvByMonth={a.gmvByMonth}
            topCategories={a.topCategories}
          />
        </div>
      </section>

      {/* Shortcuts Section */}
      <section>
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
            <p className="text-sm text-muted-foreground">
              Jump to common admin workflows
            </p>
          </div>
        </div>
        
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {shortcuts.map((s) => {
            const Icon = s.icon
            return (
              <Link
                key={s.href}
                href={s.href}
                className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 p-5 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative flex items-start gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${s.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{s.label}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {s.description}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
