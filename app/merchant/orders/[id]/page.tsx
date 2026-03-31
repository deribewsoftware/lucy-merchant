import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  ExternalLink,
  FileCheck,
  Loader2,
  MapPin,
  MessageSquare,
  Package,
  Sparkles,
  Truck,
  Wallet,
  XCircle,
} from "lucide-react";
import { CompanyReviewForms } from "@/components/company-review-forms";
import { SupplierPaymentPanel } from "@/components/supplier-payment-panel";
import { MerchantCompleteOrder } from "@/components/merchant-complete-order";
import { MerchantPlatformCommissionPanel } from "@/components/merchant-platform-commission";
import { MerchantOrderLineItemsPaginated } from "@/components/merchant-order-line-items-paginated";
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
  merchantMayOpenDeliveryDispute,
  orderFulfillmentDeliveryDeadline,
} from "@/lib/domain/order-dispute";
import { FulfillmentHandoffDisplay } from "@/components/fulfillment-handoff-display";
import { MerchantOrderDispute } from "@/components/merchant-order-dispute";
import {
  isPlatformCommissionPaid,
  isSupplierPlatformCommissionPaid,
} from "@/lib/domain/platform-commission";
import type { OrderStatus } from "@/lib/domain/types";
import { getSessionUser } from "@/lib/server/session";

type Params = { params: Promise<{ id: string }> };

function merchantStatusVisual(status: OrderStatus): {
  class: string;
  Icon: typeof Package;
} {
  switch (status) {
    case "completed":
      return { class: "bg-accent/10 text-accent border-accent/20", Icon: CheckCircle2 };
    case "rejected":
      return { class: "bg-destructive/10 text-destructive border-destructive/20", Icon: XCircle };
    case "delivered":
      return { class: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20", Icon: Truck };
    case "in_progress":
      return { class: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", Icon: Loader2 };
    case "accepted":
      return { class: "bg-primary/10 text-primary border-primary/20", Icon: FileCheck };
    case "awaiting_payment":
    case "awaiting_bank_review":
      return { class: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20", Icon: Clock };
    case "pending":
      return { class: "bg-primary/10 text-primary border-primary/20", Icon: Package };
    default:
      return { class: "bg-muted text-muted-foreground border-border", Icon: Clock };
  }
}

function payToneClass(tone: "success" | "warning" | "neutral" | "error"): string {
  switch (tone) {
    case "success":
      return "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200";
    case "error":
      return "border-destructive/30 bg-destructive/10 text-destructive";
    case "warning":
      return "border-amber-500/25 bg-amber-500/10 text-amber-900 dark:text-amber-200";
    default:
      return "border-border/50 bg-muted/50 text-muted-foreground";
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

  const merchantLineItemsVm = order.items.map((i) => {
    const p = getProduct(i.productId);
    return {
      key: `${i.productId}-${i.companyId}`,
      productId: i.productId,
      companyId: i.companyId,
      quantity: i.quantity,
      subtotal: i.subtotal,
      title: p?.name ?? i.productId,
      desc: p?.description?.trim() ?? "",
    };
  });

  const chatClosed =
    order.status === "completed" || order.status === "rejected";

  ensureLegacyPaymentForOrder(order);
  const payments = listPaymentsForOrder(order.id);
  const supplierCompanyId = order.items[0]?.companyId;
  const supplierCompany = supplierCompanyId
    ? getCompany(supplierCompanyId)
    : undefined;

  const paySummary = merchantPaymentSummary(order);
  const statusVis = merchantStatusVisual(order.status);
  const StatusIcon = statusVis.Icon;
  const commissionPaid = isPlatformCommissionPaid(order);
  const supplierCommissionPaid = isSupplierPlatformCommissionPaid(order);
  const supplierPaymentReceived = order.paymentStatus === "paid";

  const slaDays = order.deliveryCommitmentBusinessDays ?? 7;
  const deliveryDeadline = orderFulfillmentDeliveryDeadline(order);
  const showSlaBanner =
    (order.status === "accepted" || order.status === "in_progress") &&
    Boolean(deliveryDeadline);

  const placedAt = new Date(order.createdAt);
  const placedLabel = Number.isFinite(placedAt.getTime())
    ? placedAt.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : order.createdAt;

  const shortRef = `${order.id.slice(0, 8)}…`;

  return (
    <div className="animate-in fade-in duration-500 min-w-0 space-y-6 overflow-x-hidden sm:space-y-8">
      {/* Back + breadcrumb */}
      <nav className="flex flex-wrap items-center gap-2 text-sm">
        <Link
          href="/merchant/orders"
          className="group inline-flex min-h-11 min-w-[44px] items-center gap-2 rounded-lg px-1 font-medium text-muted-foreground transition hover:bg-muted/80 hover:text-primary sm:min-h-0 sm:px-0"
        >
          <ArrowLeft className="h-4 w-4 shrink-0 transition group-hover:-translate-x-0.5" />
          <span>Orders</span>
        </Link>
        <span className="text-muted-foreground/50" aria-hidden>
          /
        </span>
        <span className="font-mono text-xs text-muted-foreground tabular-nums sm:text-sm">
          {shortRef}
        </span>
      </nav>

      {/* Hero */}
      <header className="lm-card relative overflow-hidden p-5 sm:p-8">
        <div className="pointer-events-none absolute inset-0 lm-grid-pattern opacity-40" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-transparent to-accent/[0.06]" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />

        <div className="relative space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex flex-1 flex-wrap items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/25 to-primary/10 shadow-lg shadow-primary/15 ring-1 ring-primary/20">
                <ClipboardList className="h-7 w-7 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="lm-eyebrow">Order detail</span>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <h1 className="lm-heading-section">
                    Order{" "}
                    <span className="text-primary" title={order.id}>
                      {shortRef}
                    </span>
                  </h1>
                  <Sparkles
                    className="h-5 w-5 shrink-0 text-accent opacity-90"
                    aria-hidden
                  />
                </div>
                <p className="mt-2 break-all font-mono text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
                  {order.id}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${statusVis.class}`}
            >
              <StatusIcon
                className={`h-3.5 w-3.5 shrink-0 opacity-90 ${order.status === "in_progress" ? "animate-spin" : ""}`}
              />
              <span className="min-w-0">{merchantOrderStatusLabel(order.status)}</span>
            </span>
            <span
              className={`inline-flex max-w-full items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${payToneClass(paySummary.tone)}`}
            >
              <span className="min-w-0 leading-snug">{paySummary.headline}</span>
            </span>
          </div>

          {paySummary.sub ? (
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {paySummary.sub}
            </p>
          ) : null}

          {/* Quick stats */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border/50 bg-background/60 p-4 backdrop-blur-sm">
              <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <Wallet className="h-3.5 w-3.5 opacity-70" />
                Order total
              </p>
              <p className="mt-1.5 font-display text-xl font-bold tabular-nums tracking-tight text-foreground sm:text-2xl">
                {order.totalPrice.toLocaleString()}{" "}
                <span className="text-sm font-semibold text-muted-foreground">ETB</span>
              </p>
            </div>
            <div className="rounded-xl border border-border/50 bg-background/60 p-4 backdrop-blur-sm">
              <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 opacity-70" />
                Your platform fee
              </p>
              <p className="mt-1.5 font-display text-xl font-bold tabular-nums tracking-tight text-primary sm:text-2xl">
                {order.commissionAmount.toLocaleString()}{" "}
                <span className="text-sm font-semibold text-muted-foreground">ETB</span>
              </p>
            </div>
            <div className="rounded-xl border border-border/50 bg-background/60 p-4 backdrop-blur-sm">
              <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <Building2 className="h-3.5 w-3.5 opacity-70" />
                Supplier
              </p>
              <p className="mt-1.5 line-clamp-2 text-sm font-semibold leading-snug text-foreground sm:text-base">
                {supplierCompany?.name ?? "—"}
              </p>
            </div>
            <div className="rounded-xl border border-border/50 bg-background/60 p-4 backdrop-blur-sm">
              <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 opacity-70" />
                Placed
              </p>
              <p className="mt-1.5 text-sm font-semibold leading-snug text-foreground sm:text-base">
                {placedLabel}
              </p>
            </div>
          </div>

          {/* Delivery */}
          <div className="rounded-xl border border-border/50 bg-background/50 p-4 backdrop-blur-sm sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {order.fulfillmentHandoff === "merchant_pickup_at_supplier"
                    ? "Address & pickup notes"
                    : "Delivery address"}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground sm:text-base">
                  {order.deliveryLocation || "—"}
                </p>
                {order.deliveryLocation.trim() ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryLocation.trim())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Open in Google Maps
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-80" />
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          <FulfillmentHandoffDisplay
            fulfillmentHandoff={order.fulfillmentHandoff}
            audience="merchant"
            supplierCompanyId={supplierCompanyId}
            supplierCompanyName={supplierCompany?.name}
          />
        </div>
      </header>

      <nav
        aria-label="On this page"
        className="flex flex-wrap items-center gap-x-1 gap-y-2 rounded-xl border border-border/40 bg-muted/35 px-3 py-2.5 text-xs sm:gap-x-2 sm:text-sm"
      >
        <span className="hidden shrink-0 font-medium text-muted-foreground sm:inline">
          Jump to
        </span>
        <a
          href="#order-progress"
          className="rounded-full px-2.5 py-1.5 font-medium text-muted-foreground transition hover:bg-background/90 hover:text-primary"
        >
          Progress
        </a>
        <span className="text-muted-foreground/40" aria-hidden>
          ·
        </span>
        <a
          href="#order-payment"
          className="rounded-full px-2.5 py-1.5 font-medium text-muted-foreground transition hover:bg-background/90 hover:text-primary"
        >
          Payment
        </a>
        <span className="text-muted-foreground/40" aria-hidden>
          ·
        </span>
        <a
          href="#order-lines"
          className="rounded-full px-2.5 py-1.5 font-medium text-muted-foreground transition hover:bg-background/90 hover:text-primary"
        >
          Line items
        </a>
        <span className="text-muted-foreground/40" aria-hidden>
          ·
        </span>
        <a
          href="#order-chat"
          className="rounded-full px-2.5 py-1.5 font-medium text-muted-foreground transition hover:bg-background/90 hover:text-primary"
        >
          Chat
        </a>
      </nav>

      <div className="grid min-w-0 gap-6 lg:grid-cols-12 lg:items-start lg:gap-8">
        {/* Payment first on narrow screens */}
        <aside
          id="order-payment"
          className="order-1 min-w-0 scroll-mt-28 space-y-6 lg:order-2 lg:col-span-4 lg:sticky lg:top-24 lg:self-start"
        >
          <OrderPaymentSummary
            order={order}
            payments={payments}
            variant="merchant"
            audience="merchant"
          />
        </aside>

        <div className="order-2 min-w-0 space-y-6 lg:order-1 lg:col-span-8">
          <div
            id="order-progress"
            className="scroll-mt-28 overflow-hidden rounded-xl border border-border/50 bg-card/60 p-1.5 shadow-sm ring-1 ring-border/20 sm:p-2"
          >
            <OrderFulfillmentTracker order={order} role="merchant" />
          </div>

          {showSlaBanner && deliveryDeadline ? (
            <div className="lm-card scroll-mt-28 border-amber-500/20 bg-amber-500/[0.06] p-5 sm:p-6">
              <p className="font-display text-xs font-bold uppercase tracking-wider text-amber-900/80 dark:text-amber-200/90">
                Delivery window
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground sm:text-base">
                Listing lead time (upper bound):{" "}
                <span className="font-semibold tabular-nums">{slaDays}</span> business days from
                supplier acceptance.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Stated “not after” target:{" "}
                <span className="font-medium text-foreground">
                  {deliveryDeadline.toLocaleString()}
                </span>
              </p>
            </div>
          ) : null}

          <MerchantOrderDispute
            orderId={id}
            canOpen={merchantMayOpenDeliveryDispute(order)}
            openedAt={order.merchantDisputeOpenedAt}
            reason={order.merchantDisputeReason}
          />

          <SupplierPaymentPanel order={order} company={supplierCompany} />

          <MerchantPlatformCommissionPanel order={order} />

          <section id="order-lines" className="lm-card scroll-mt-28 overflow-hidden p-0">
            <div className="border-b border-border/40 bg-gradient-to-r from-muted/40 to-transparent px-5 py-4 sm:px-6">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Package className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="lm-heading-card">Line items</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                      {order.items.length} line{order.items.length === 1 ? "" : "s"} ·{" "}
                      {supplierCompany?.name ?? "Supplier"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <MerchantOrderLineItemsPaginated
              items={merchantLineItemsVm}
              resetKey={order.id}
            />
          </section>

          <section id="order-chat" className="lm-card scroll-mt-28 space-y-4">
            <div className="flex flex-col gap-1 border-b border-border/40 pb-4 sm:flex-row sm:items-start sm:gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="lm-heading-card">Order chat</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Message the supplier about this order.
                </p>
              </div>
            </div>
            <div className="min-w-0">
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
      </div>
    </div>
  );
}
