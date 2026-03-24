import Link from "next/link"
import {
  ClipboardList,
  MapPin,
  Package,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Loader2,
  FileCheck,
  Sparkles,
} from "lucide-react"
import { PaginationBar } from "@/components/ui/pagination-bar"
import { getProduct } from "@/lib/db/catalog"
import { ordersForMerchant } from "@/lib/db/commerce"
import type { OrderStatus } from "@/lib/domain/types"
import { getSessionUser } from "@/lib/server/session"

type Props = {
  searchParams: Promise<{ page?: string }>
}

function getStatusConfig(status: OrderStatus) {
  switch (status) {
    case "completed":
      return {
        icon: CheckCircle2,
        class: "bg-accent/10 text-accent border-accent/20",
        label: "Completed"
      }
    case "rejected":
      return {
        icon: XCircle,
        class: "bg-destructive/10 text-destructive border-destructive/20",
        label: "Rejected"
      }
    case "delivered":
      return {
        icon: Truck,
        class: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        label: "Delivered"
      }
    case "in_progress":
      return {
        icon: Loader2,
        class: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        label: "In Progress"
      }
    case "accepted":
      return {
        icon: FileCheck,
        class: "bg-primary/10 text-primary border-primary/20",
        label: "Accepted"
      }
    default:
      return {
        icon: Clock,
        class: "bg-muted text-muted-foreground border-border",
        label: "Pending"
      }
  }
}

export default async function MerchantOrdersPage({ searchParams }: Props) {
  const user = await getSessionUser()
  const all = user ? ordersForMerchant(user.id) : []
  const sp = await searchParams
  const pageRaw = parseInt(sp.page ?? "1", 10)
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1
  const pageSize = 12
  const total = all.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * pageSize
  const orders = all.slice(start, start + pageSize)

  const href = (p: number) =>
    p > 1 ? `/merchant/orders?page=${p}` : "/merchant/orders"

  // Stats
  const completedCount = all.filter(o => o.status === 'completed').length
  const pendingCount = all.filter(o => o.status === 'pending').length
  const totalRevenue = all.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.totalPrice, 0)

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <header className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card via-primary/5 to-accent/5 p-6 sm:p-8">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-accent/5 blur-2xl" />
        
        <div className="relative flex flex-wrap items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg shadow-primary/20">
            <ClipboardList className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                My Orders
              </h1>
              <Sparkles className="h-5 w-5 text-accent animate-pulse" />
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Track your orders through the complete lifecycle: pending, accepted, in progress, delivered, and completed.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="relative mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border/50 bg-background/50 p-4 backdrop-blur-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Orders</p>
            <p className="mt-1 text-xl font-bold text-foreground">{total}</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-background/50 p-4 backdrop-blur-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Completed</p>
            <p className="mt-1 text-xl font-bold text-accent">{completedCount}</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-background/50 p-4 backdrop-blur-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pending</p>
            <p className="mt-1 text-xl font-bold text-amber-500">{pendingCount}</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-background/50 p-4 backdrop-blur-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Revenue</p>
            <p className="mt-1 text-xl font-bold text-foreground">{totalRevenue.toLocaleString()} ETB</p>
          </div>
        </div>
      </header>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50">
              <Package className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="mt-6 text-lg font-semibold text-foreground">No orders yet</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Build a cart from the catalog and check out to create your first order.
            </p>
            <Link
              href="/browse"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90"
            >
              Browse Products
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          orders.map((o, index) => {
            const statusConfig = getStatusConfig(o.status)
            const StatusIcon = statusConfig.icon
            
            return (
              <article
                key={o.id}
                className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 p-5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Hover gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                
                <div className="relative">
                  {/* Top row */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link
                      href={`/merchant/orders/${o.id}`}
                      className="font-mono text-xs text-primary transition-colors hover:text-primary/80"
                    >
                      #{o.id.slice(0, 8)}...
                    </Link>
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${statusConfig.class}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Title link */}
                  <Link
                    href={`/merchant/orders/${o.id}`}
                    className="mt-4 inline-flex items-center gap-2 text-base font-semibold text-foreground transition-colors hover:text-primary"
                  >
                    View Order Details
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>

                  {/* Location */}
                  <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary/60" />
                    <span>{o.deliveryLocation}</span>
                  </div>

                  {/* Price info */}
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <span className="font-semibold text-foreground">
                      {o.totalPrice.toLocaleString()} ETB
                    </span>
                    <span className="text-muted-foreground">
                      Commission: {o.commissionAmount.toLocaleString()} ETB
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      o.paymentStatus === 'paid' 
                        ? 'bg-accent/10 text-accent' 
                        : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {o.paymentStatus}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="mt-4 border-t border-border/50 pt-4">
                    <ul className="flex flex-wrap gap-2">
                      {o.items.slice(0, 3).map((i) => {
                        const p = getProduct(i.productId)
                        return (
                          <li key={i.productId}>
                            <Link
                              href={`/products/${i.productId}`}
                              className="inline-flex items-center gap-1 rounded-lg bg-muted/50 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                            >
                              <Package className="h-3 w-3" />
                              {p?.name ?? 'Product'} x{i.quantity}
                            </Link>
                          </li>
                        )
                      })}
                      {o.items.length > 3 && (
                        <li className="inline-flex items-center rounded-lg bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                          +{o.items.length - 3} more
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </article>
            )
          })
        )}
      </div>

      <PaginationBar
        page={safePage}
        pageSize={pageSize}
        total={total}
        buildHref={href}
        variant="admin"
      />
    </div>
  )
}
