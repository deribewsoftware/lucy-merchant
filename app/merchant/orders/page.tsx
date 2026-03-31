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
  AlertTriangle,
} from "lucide-react"
import { PaginatedOrderLineLinks } from "@/components/paginated-order-line-links"
import { PaginationBar, PaginationSummary } from "@/components/ui/pagination-bar"
import { getProduct } from "@/lib/db/catalog"
import { ordersForMerchant } from "@/lib/db/commerce"
import { merchantPaymentSummary } from "@/lib/domain/order-presentations"
import { fulfillmentHandoffShortLabel } from "@/lib/domain/fulfillment-handoff-copy"
import { merchantMayOpenDeliveryDispute } from "@/lib/domain/order-dispute"
import {
  isPlatformCommissionPaid,
  isSupplierPlatformCommissionPaid,
} from "@/lib/domain/platform-commission"
import type { OrderStatus } from "@/lib/domain/types"
import {
  MERCHANT_ORDERS_HOLD_EXPLAINER_BODY,
  MERCHANT_ORDERS_HOLD_EXPLAINER_TITLE,
} from "@/lib/domain/commission-hold-copy"
import { getSessionUser } from "@/lib/server/session"

type Props = {
  searchParams: Promise<{ page?: string; hold?: string }>
}

function getStatusConfig(status: OrderStatus) {
  switch (status) {
    case "awaiting_payment":
      return {
        icon: Clock,
        class: "bg-amber-500/10 text-amber-600 border-amber-500/20",
        label: "Awaiting payment",
      }
    case "awaiting_bank_review":
      return {
        icon: Clock,
        class: "bg-amber-500/10 text-amber-700 border-amber-500/20",
        label: "Bank review",
      }
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
    case "pending":
      return {
        icon: Package,
        class: "bg-primary/10 text-primary border-primary/20",
        label: "Awaiting supplier",
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
  const showCommissionHold = sp.hold === "commission"
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
  const completedCount = all.filter((o) => o.status === "completed").length
  const awaitingSupplierCount = all.filter((o) => o.status === "pending").length
  const totalRevenue = all
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + o.totalPrice, 0)

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {showCommissionHold ? (
        <div
          className="flex flex-wrap items-start gap-3 rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-4 text-sm text-foreground shadow-sm sm:items-center sm:px-5"
          role="status"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{MERCHANT_ORDERS_HOLD_EXPLAINER_TITLE}</p>
            <p className="mt-1 text-muted-foreground">{MERCHANT_ORDERS_HOLD_EXPLAINER_BODY}</p>
          </div>
        </div>
      ) : null}
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
              The payment line shows Paid only after the platform clears funds (admin approval for
              bank transfers, card, and Chapa). Suppliers then fulfill → delivery → payout → you
              complete.
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
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Awaiting supplier
            </p>
            <p className="mt-1 text-xl font-bold text-primary">{awaitingSupplierCount}</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-background/50 p-4 backdrop-blur-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Revenue</p>
            <p className="mt-1 text-xl font-bold text-foreground">{totalRevenue.toLocaleString()} ETB</p>
          </div>
        </div>
      </header>

      {total > 0 && (
        <PaginationSummary
          page={safePage}
          pageSize={pageSize}
          total={total}
          className="text-sm text-muted-foreground"
        />
      )}

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/40 bg-card/50 px-6 py-16 text-center">
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
            const pay = merchantPaymentSummary(o)
            const payClass =
              pay.tone === "success"
                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                : pay.tone === "warning"
                  ? "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-200"
                  : pay.tone === "error"
                    ? "border-red-500/25 bg-red-500/10 text-red-800 dark:text-red-200"
                    : "border-border/50 bg-muted/50 text-muted-foreground"

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
                  {o.fulfillmentHandoff ? (
                    <p className="mt-2">
                      <span className="inline-flex items-center rounded-full border border-sky-500/25 bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-sky-800 dark:text-sky-200">
                        {fulfillmentHandoffShortLabel(o.fulfillmentHandoff)}
                      </span>
                    </p>
                  ) : null}
                  {o.merchantDisputeOpenedAt ? (
                    <p className="mt-2">
                      <span className="inline-flex items-center rounded-full border border-amber-500/35 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
                        Dispute filed
                      </span>
                    </p>
                  ) : merchantMayOpenDeliveryDispute(o) ? (
                    <p className="mt-2">
                      <span className="inline-flex items-center rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-destructive">
                        Delivery overdue — open dispute
                      </span>
                    </p>
                  ) : null}
                  {o.status === "rejected" && o.supplierRejectionReason?.trim() ? (
                    <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Supplier: </span>
                      {o.supplierRejectionReason.trim()}
                    </p>
                  ) : null}
                  {o.status === "delivered" &&
                  o.commissionAmount > 0 &&
                  !isPlatformCommissionPaid(o) ? (
                    <p className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-500">
                      Pay your buyer platform commission — browsing and checkout stay limited
                      until you record it.
                    </p>
                  ) : null}
                  {o.status === "delivered" &&
                  isPlatformCommissionPaid(o) &&
                  (o.supplierCommissionAmount ?? 0) > 0 &&
                  !isSupplierPlatformCommissionPaid(o) ? (
                    <p className="mt-2 text-xs font-medium text-violet-600 dark:text-violet-400">
                      Your fee is recorded — waiting for the supplier to pay their platform
                      commission.
                    </p>
                  ) : null}
                  {o.status === "delivered" &&
                  isPlatformCommissionPaid(o) &&
                  isSupplierPlatformCommissionPaid(o) &&
                  o.paymentStatus !== "paid" ? (
                    <p className="mt-2 text-xs font-medium text-sky-600 dark:text-sky-400">
                      Fees recorded — waiting for supplier to confirm they received payment.
                    </p>
                  ) : null}
                  {o.status === "delivered" &&
                  isPlatformCommissionPaid(o) &&
                  isSupplierPlatformCommissionPaid(o) &&
                  o.paymentStatus === "paid" ? (
                    <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-500">
                      Ready to complete — mark the order when you are satisfied.
                    </p>
                  ) : null}

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
                  <div className="mt-3 flex flex-wrap items-start gap-x-4 gap-y-2 text-sm">
                    <span className="font-semibold text-foreground">
                      {o.totalPrice.toLocaleString()} ETB
                    </span>
                    <span className="text-muted-foreground">
                      Merchant platform fee{" "}
                      {o.commissionAmount.toLocaleString()} ETB
                    </span>
                    <span
                      className={`inline-flex max-w-[min(100%,18rem)] flex-col gap-0.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium sm:max-w-xs ${payClass}`}
                      title={pay.sub}
                    >
                      <span className="leading-tight">{pay.headline}</span>
                      {pay.sub ? (
                        <span className="text-[10px] font-normal opacity-90 line-clamp-2">
                          {pay.sub}
                        </span>
                      ) : null}
                    </span>
                  </div>

                  {/* Products */}
                  <div className="mt-4 border-t border-border/50 pt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Products
                    </p>
                    <PaginatedOrderLineLinks
                      lines={o.items.map((i) => ({
                        key: `${i.productId}-${i.companyId}`,
                        productId: i.productId,
                        title: getProduct(i.productId)?.name ?? i.productId,
                        quantity: i.quantity,
                      }))}
                    />
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
      />
    </div>
  )
}
