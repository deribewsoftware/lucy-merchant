import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ClipboardList,
  ExternalLink,
  MapPin,
  MessageSquare,
  Package,
  Sparkles,
} from "lucide-react";
import { CompanyReviewForms } from "@/components/company-review-forms";
import { SupplierPaymentPanel } from "@/components/supplier-payment-panel";
import { MerchantCompleteOrder } from "@/components/merchant-complete-order";
import { MerchantPlatformCommissionPanel } from "@/components/merchant-platform-commission";
import { OrderFulfillmentTracker } from "@/components/order-fulfillment-tracker";
import { OrderChat } from "@/components/order-chat";
import { OrderPaymentSummary } from "@/components/order-payment-summary";
import { ProductReviewForms } from "@/components/product-review-forms";
import { getCompany, getProduct } from "@/lib/db/catalog";
import { getOrder } from "@/lib/db/commerce";
import {
  ensureLegacyPaymentForOrder,
  listPaymentsForOrder,
} from "@/lib/db/payments";
import { hasReviewForOrderProduct } from "@/lib/db/product-reviews";
import { hasReviewForOrderCompany } from "@/lib/db/reviews";
import {
  merchantOrderStatusLabel,
  merchantPaymentSummary,
} from "@/lib/domain/order-presentations";
import {
  isPlatformCommissionPaid,
  isSupplierPlatformCommissionPaid,
} from "@/lib/domain/platform-commission";
import type { OrderStatus } from "@/lib/domain/types";
import { getSessionUser } from "@/lib/server/session";

type Params = { params: Promise<{ id: string }> };

function statusPill(status: OrderStatus): { class: string; Icon: typeof Package } {
  switch (status) {
    case "completed":
      return { class: "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200", Icon: Package };
    case "rejected":
      return { class: "border-destructive/50 bg-destructive/10 text-destructive", Icon: Package };
    case "delivered":
      return { class: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300", Icon: Package };
    case "in_progress":
      return { class: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200", Icon: Package };
    case "accepted":
      return { class: "border-primary/30 bg-primary/10 text-primary", Icon: Package };
    case "awaiting_payment":
    case "awaiting_bank_review":
      return { class: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200", Icon: Package };
    case "pending":
      return { class: "border-primary/30 bg-primary/10 text-primary", Icon: Package };
    default:
      return { class: "border-border/50 bg-muted/50 text-muted-foreground", Icon: Package };
  }
}

export default async function MerchantOrderDetailPage({ params }: Params) {
  const { id } = await params;
  const user = await getSessionUser();
  const order = getOrder(id);
  if (!user || user.role !== "merchant" || !order || order.merchantId !== user.id) {
    notFound();
  }

  const companyIds = [...new Set(order.items.map((i) => i.companyId))];
  const companies = companyIds.map((cid) => ({
    id: cid,
    name: getCompany(cid)?.name ?? "Company",
    alreadyReviewed: hasReviewForOrderCompany(id, cid, user.id),
  }));

  const productIds = [...new Set(order.items.map((i) => i.productId))];
  const reviewProducts = productIds.map((pid) => ({
    id: pid,
    name: getProduct(pid)?.name ?? pid,
    alreadyReviewed: hasReviewForOrderProduct(id, pid, user.id),
  }));

  const chatClosed =
    order.status === "completed" || order.status === "rejected";

  ensureLegacyPaymentForOrder(order);
  const payments = listPaymentsForOrder(order.id);
  const supplierCompanyId = order.items[0]?.companyId;
  const supplierCompany = supplierCompanyId
    ? getCompany(supplierCompanyId)
    : undefined;

  const paySummary = merchantPaymentSummary(order);
  const pill = statusPill(order.status);
  const commissionPaid = isPlatformCommissionPaid(order);
  const supplierCommissionPaid = isSupplierPlatformCommissionPaid(order);
  const supplierPaymentReceived = order.paymentStatus === "paid";

  return (
    <div className="animate-in fade-in duration-500 min-w-0 space-y-8 overflow-x-hidden">
      <Link
        href="/merchant/orders"
        className="group inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" />
        Back to orders
      </Link>

      <header className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card via-primary/[0.04] to-accent/[0.06] p-6 shadow-sm ring-1 ring-border/30 sm:p-8">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-accent/5 blur-2xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg shadow-primary/15">
                <ClipboardList className="h-7 w-7 text-primary" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    Order
                  </h1>
                  <Sparkles className="h-5 w-5 shrink-0 text-accent animate-pulse" />
                </div>
                <p className="mt-1 font-mono text-xs text-muted-foreground break-all">
                  {order.id}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${pill.class}`}
              >
                <pill.Icon className="h-3.5 w-3.5 opacity-80" />
                {merchantOrderStatusLabel(order.status)}
              </span>
              <span
                className={
                  paySummary.tone === "success"
                    ? "inline-flex rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-200"
                    : paySummary.tone === "error"
                      ? "inline-flex rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive"
                      : paySummary.tone === "warning"
                        ? "inline-flex rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-900 dark:text-amber-200"
                        : "inline-flex rounded-full border border-border/50 bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground"
                }
              >
                {paySummary.headline}
              </span>
            </div>
            {paySummary.sub ? (
              <p className="max-w-2xl text-sm text-muted-foreground">{paySummary.sub}</p>
            ) : null}

            <div className="flex flex-wrap gap-4 border-t border-border/40 pt-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Order total
                </p>
                <p className="mt-0.5 font-display text-xl font-bold tabular-nums text-foreground">
                  {order.totalPrice.toLocaleString()}{" "}
                  <span className="text-sm font-semibold text-muted-foreground">ETB</span>
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Merchant platform commission
                </p>
                <p className="mt-0.5 font-display text-xl font-bold tabular-nums text-primary">
                  {order.commissionAmount.toLocaleString()}{" "}
                  <span className="text-sm font-semibold text-muted-foreground">ETB</span>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-border/40 bg-background/50 p-4 backdrop-blur-sm">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Delivery
                </p>
                <p className="mt-1 text-sm leading-relaxed text-foreground">
                  {order.deliveryLocation}
                </p>
                {order.deliveryLocation.trim() ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryLocation.trim())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-2 hover:underline"
                  >
                    Open in Google Maps
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="grid min-w-0 gap-6 lg:grid-cols-12 lg:items-start lg:gap-8">
        <div className="min-w-0 space-y-6 lg:col-span-8">
          <div className="rounded-2xl border border-border/40 bg-card/50 p-1 shadow-sm ring-1 ring-border/20">
            <OrderFulfillmentTracker order={order} role="merchant" />
          </div>

          <SupplierPaymentPanel order={order} company={supplierCompany} />

          <MerchantPlatformCommissionPanel order={order} />

          <section className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm ring-1 ring-border/20">
            <div className="border-b border-border/40 bg-gradient-to-r from-muted/30 to-transparent px-5 py-4 sm:px-6">
              <h2 className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
                <Package className="h-5 w-5 text-primary" />
                Line items
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {order.items.length} line{order.items.length === 1 ? "" : "s"} ·{" "}
                {supplierCompany?.name ?? "Supplier"}
              </p>
            </div>
            <ul className="divide-y divide-border/50">
              {order.items.map((i) => {
                const p = getProduct(i.productId);
                const title = p?.name ?? i.productId;
                const desc = p?.description?.trim() ?? "";
                return (
                  <li key={`${i.productId}-${i.companyId}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 transition hover:bg-muted/30 sm:px-6">
                      <Link
                        href={`/products/${i.productId}`}
                        className="group min-w-0 max-w-xl flex-1"
                      >
                        <span className="font-semibold text-foreground underline-offset-2 group-hover:text-primary group-hover:underline">
                          {title}
                        </span>
                        {desc ? (
                          <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                            {desc}
                          </p>
                        ) : null}
                      </Link>
                      <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                        × {i.quantity} — {i.subtotal.toLocaleString()} ETB
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm ring-1 ring-border/20 sm:p-6">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
              <MessageSquare className="h-5 w-5 text-primary" />
              Order chat
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Message the supplier about this order.
            </p>
            <div className="mt-4">
              <OrderChat
                orderId={id}
                viewerId={user.id}
                viewerRole="merchant"
                closed={chatClosed}
                paymentGate={
                  order.status === "awaiting_payment" ||
                  order.status === "awaiting_bank_review"
                }
              />
            </div>
          </section>

          {order.status === "delivered" && (
            <MerchantCompleteOrder
              orderId={id}
              commissionPaid={commissionPaid}
              supplierCommissionPaid={supplierCommissionPaid}
              supplierPaymentReceived={supplierPaymentReceived}
            />
          )}

          {order.status === "completed" && (
            <div className="space-y-6">
              <CompanyReviewForms orderId={id} companies={companies} />
              <ProductReviewForms orderId={id} products={reviewProducts} />
            </div>
          )}
        </div>

        <aside className="min-w-0 space-y-6 lg:col-span-4 lg:sticky lg:top-24">
          <OrderPaymentSummary
            order={order}
            payments={payments}
            variant="merchant"
            audience="merchant"
          />
        </aside>
      </div>
    </div>
  );
}
