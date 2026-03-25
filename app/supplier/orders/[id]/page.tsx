import Link from "next/link";
import { notFound } from "next/navigation";
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineMapPin,
  HiOutlineShoppingBag,
  HiOutlineUserCircle,
} from "react-icons/hi2";
import { OrderChat } from "@/components/order-chat";
import { OrderFulfillmentTracker } from "@/components/order-fulfillment-tracker";
import { OrderPaymentSummary } from "@/components/order-payment-summary";
import { SupplierOrderActions } from "@/components/supplier-order-actions";
import { SupplierPaymentActions } from "@/components/supplier-payment-actions";
import { SupplierPlatformCommissionPanel } from "@/components/supplier-platform-commission";
import { companiesByOwner, getProduct } from "@/lib/db/catalog";
import { getOrder } from "@/lib/db/commerce";
import {
  ensureLegacyPaymentForOrder,
  listPaymentsForOrder,
} from "@/lib/db/payments";
import { findUserById } from "@/lib/db/users";
import {
  orderStatusBadgeClass,
  orderStatusLabel,
  supplierOrderGuidance,
} from "@/lib/domain/order-presentations";
import {
  isPlatformCommissionPaid,
  isSupplierPlatformCommissionPaid,
} from "@/lib/domain/platform-commission";
import { getSessionUser } from "@/lib/server/session";

type Params = { params: Promise<{ id: string }> };

function merchantInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default async function SupplierOrderDetailPage({ params }: Params) {
  const { id } = await params;
  const user = await getSessionUser();
  const order = getOrder(id);
  if (!user || user.role !== "supplier" || !order) {
    notFound();
  }
  const mine = new Set(companiesByOwner(user.id).map((c) => c.id));
  if (!order.items.some((i) => mine.has(i.companyId))) {
    notFound();
  }
  if (
    order.status === "awaiting_payment" ||
    order.status === "awaiting_bank_review"
  ) {
    notFound();
  }

  const chatClosed =
    order.status === "completed" || order.status === "rejected";

  ensureLegacyPaymentForOrder(order);
  const payments = listPaymentsForOrder(order.id);

  const merchant = findUserById(order.merchantId);
  const merchantLabel = merchant?.name ?? "Buyer";
  const guidance = supplierOrderGuidance(order);
  const supplierCommOwed = Math.round((order.supplierCommissionAmount ?? 0) * 100) / 100;
  const supplierCommPaid = isSupplierPlatformCommissionPaid(order);

  return (
    <div className="space-y-8 pb-10">
      <Link
        href="/supplier/orders"
        className="link link-primary text-sm no-underline hover:underline"
      >
        ← Back to orders
      </Link>

      <header className="relative overflow-hidden rounded-3xl border border-base-300 bg-gradient-to-br from-base-100 via-primary/[0.04] to-base-200/30 p-6 shadow-md ring-1 ring-base-300/20 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`badge badge-lg font-semibold capitalize ${orderStatusBadgeClass(order.status)}`}
              >
                {orderStatusLabel(order.status)}
              </span>
              <span
                className={
                  order.paymentStatus === "paid"
                    ? "badge badge-success badge-lg"
                    : order.paymentStatus === "failed"
                      ? "badge badge-error badge-lg"
                      : "badge badge-warning badge-lg"
                }
              >
                Payment: {order.paymentStatus}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary/80">
                Supplier · order
              </p>
              <h1 className="font-display mt-1 text-2xl font-bold tracking-tight text-base-content sm:text-3xl">
                Order{" "}
                <span className="font-mono text-primary">
                  {order.id.slice(0, 8).toUpperCase()}
                </span>
              </h1>
              <p className="mt-1 break-all font-mono text-xs text-base-content/45 sm:text-sm">
                {order.id}
              </p>
            </div>
            {guidance ? (
              <p className="max-w-2xl text-sm leading-relaxed text-base-content/70">
                {guidance}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col items-end gap-3 text-end sm:flex-row sm:items-start sm:gap-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-base-content/45">
                Order total
              </p>
              <p className="font-display text-3xl font-bold tabular-nums text-base-content sm:text-4xl">
                {order.totalPrice.toLocaleString()}{" "}
                <span className="text-lg font-semibold text-base-content/50">
                  ETB
                </span>
              </p>
            </div>
            {supplierCommOwed > 0 ? (
              <div className="rounded-2xl border border-violet-500/25 bg-violet-500/[0.06] px-4 py-3 text-end ring-1 ring-violet-500/10">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300">
                  Supplier platform commission
                </p>
                <p className="mt-1 font-display text-2xl font-bold tabular-nums text-base-content sm:text-3xl">
                  {supplierCommOwed.toLocaleString()}{" "}
                  <span className="text-sm font-semibold text-base-content/55">
                    ETB
                  </span>
                </p>
                <p className="mt-1 text-xs font-medium text-base-content/65">
                  {supplierCommPaid ? "Recorded as paid" : "Pay to platform after delivery"}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-base-300/80 bg-base-200/30 px-4 py-3 text-end">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-base-content/45">
                  Supplier platform commission
                </p>
                <p className="mt-1 text-sm font-medium text-base-content/70">
                  No supplier fee on this order
                </p>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        <div className="space-y-6 lg:col-span-8">
          <OrderFulfillmentTracker order={order} role="supplier" />

          <section className="overflow-hidden rounded-3xl border border-base-300 bg-base-100 shadow-md ring-1 ring-base-300/20">
            <div className="flex items-center gap-2 border-b border-base-300 bg-base-200/40 px-5 py-4 sm:px-6">
              <HiOutlineShoppingBag className="h-5 w-5 text-secondary" />
              <h2 className="font-display text-base font-bold text-base-content">
                Line items
              </h2>
            </div>
            <ul className="divide-y divide-base-200">
              {order.items.map((i) => {
                const p = getProduct(i.productId);
                const isYours = mine.has(i.companyId);
                const title = p?.name ?? i.productId;
                const desc = p?.description?.trim() ?? "";
                return (
                  <li
                    key={`${i.productId}-${i.companyId}`}
                    className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 sm:px-6"
                  >
                    <div className="min-w-0 max-w-xl flex-1">
                      <Link
                        href={`/products/${i.productId}`}
                        className="group block"
                      >
                        <span className="font-semibold text-base-content underline-offset-2 group-hover:text-primary group-hover:underline">
                          {title}
                        </span>
                        {desc ? (
                          <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-base-content/65">
                            {desc}
                          </p>
                        ) : null}
                      </Link>
                      <p className="mt-2 text-sm tabular-nums text-base-content/65">
                        Qty {i.quantity}
                      </p>
                      {!isYours ? (
                        <p className="mt-1 text-xs text-warning">
                          Another supplier on this checkout — you only control
                          status for your catalog.
                        </p>
                      ) : null}
                    </div>
                    <p className="shrink-0 font-semibold tabular-nums text-base-content">
                      {i.subtotal.toLocaleString()} ETB
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-md ring-1 ring-base-300/20 sm:p-6">
            <h2 className="flex items-center gap-2 font-display text-base font-bold text-base-content">
              <HiOutlineChatBubbleLeftRight className="h-5 w-5 text-secondary" />
              Chat with buyer
            </h2>
            <p className="mt-1 text-xs text-base-content/50">
              Coordinate delivery details or clarify quantities in one thread.
            </p>
            <div className="mt-4">
              <OrderChat
                orderId={id}
                viewerId={user.id}
                viewerRole="supplier"
                closed={chatClosed}
              />
            </div>
          </section>
        </div>

        <aside className="space-y-6 lg:col-span-4 lg:sticky lg:top-24">
          <div className="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-md sm:p-6">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-base-content/45">
              <HiOutlineUserCircle className="h-4 w-4" />
              Buyer
            </h2>
            <div className="mt-4 flex gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/15 font-display text-lg font-bold text-primary"
                aria-hidden
              >
                {merchantInitials(merchantLabel)}
              </div>
              <div className="min-w-0">
                <p className="font-display text-lg font-bold text-base-content">
                  {merchantLabel}
                </p>
                {merchant?.email ? (
                  <p className="mt-1 break-all text-sm text-base-content/60">
                    {merchant.email}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-md sm:p-6">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-base-content/45">
              <HiOutlineMapPin className="h-4 w-4" />
              Delivery
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-base-content/80">
              {order.deliveryLocation || "—"}
            </p>
            {order.deliveryLocation.trim() ? (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryLocation.trim())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline btn-sm mt-4 w-full border-base-300"
              >
                Open in Google Maps
              </a>
            ) : null}
          </div>

          <div className="rounded-3xl border border-base-300 bg-gradient-to-b from-base-100 to-base-200/35 p-5 shadow-md ring-1 ring-base-300/25 sm:p-6">
            <h2 className="text-sm font-semibold text-base-content">
              Update fulfillment
            </h2>
            <p className="mt-1 text-xs text-base-content/55">
              Move the order forward when you are ready — the buyer is notified
              at each step.
            </p>
            <div className="mt-4">
              <SupplierOrderActions
                orderId={id}
                order={{
                  status: order.status,
                  paymentMethod: order.paymentMethod,
                  paymentStatus: order.paymentStatus,
                }}
                platformCommissionPaid={isPlatformCommissionPaid(order)}
                supplierCommissionPaid={supplierCommPaid}
                supplierCommissionOwed={supplierCommOwed}
              />
            </div>
          </div>

          <SupplierPaymentActions
            order={{
              id: order.id,
              status: order.status,
              paymentMethod: order.paymentMethod,
              paymentStatus: order.paymentStatus,
            }}
          />

          <SupplierPlatformCommissionPanel
            order={{
              id: order.id,
              status: order.status,
              supplierCommissionAmount: order.supplierCommissionAmount,
              supplierCommissionPaidAt: order.supplierCommissionPaidAt,
              supplierCommissionProofImagePath:
                order.supplierCommissionProofImagePath,
            }}
          />

          <OrderPaymentSummary
            order={order}
            payments={payments}
            variant="portal"
            audience="supplier"
          />
        </aside>
      </div>
    </div>
  );
}
