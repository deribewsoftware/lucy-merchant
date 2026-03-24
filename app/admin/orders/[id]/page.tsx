import Link from "next/link";
import { notFound } from "next/navigation";
import { HiOutlineArrowLeft, HiOutlineClipboardDocumentList } from "react-icons/hi2";
import { OrderPaymentSummary } from "@/components/order-payment-summary";
import { SupplierConfirmPayment } from "@/components/supplier-confirm-payment";
import { getCompany, getProduct } from "@/lib/db/catalog";
import { getOrder } from "@/lib/db/commerce";
import {
  ensureLegacyPaymentForOrder,
  listPaymentsForOrder,
} from "@/lib/db/payments";
import { findUserById } from "@/lib/db/users";

type Params = { params: Promise<{ id: string }> };

export default async function AdminOrderDetailPage({ params }: Params) {
  const { id } = await params;
  const order = getOrder(id);
  if (!order) notFound();

  ensureLegacyPaymentForOrder(order);
  const payments = listPaymentsForOrder(order.id);
  const merchant = findUserById(order.merchantId);

  const hasPendingPayment = payments.some((p) => p.status === "pending");
  const canConfirmPayment =
    order.paymentStatus === "pending" &&
    hasPendingPayment &&
    order.status !== "rejected";

  return (
    <div className="space-y-8">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
      >
        <HiOutlineArrowLeft className="h-4 w-4" />
        All orders
      </Link>

      <header className="flex flex-col gap-4 border-b border-base-300 pb-8 sm:flex-row sm:items-start">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <HiOutlineClipboardDocumentList className="h-7 w-7" />
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-base-content">
            Order detail
          </h1>
          <p className="mt-1 font-mono text-xs text-base-content/45">
            {order.id}
          </p>
          <p className="mt-3 text-sm text-base-content/70">
            Merchant:{" "}
            <span className="font-semibold text-base-content">
              {merchant?.name ?? order.merchantId}
            </span>
            {merchant?.email ? ` · ${merchant.email}` : ""}
          </p>
          <p className="mt-2 text-sm text-base-content/70">
            {order.deliveryLocation}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-base-200 px-3 py-1 text-xs font-semibold capitalize text-base-content">
              {order.status.replace("_", " ")}
            </span>
            <span
              className={
                order.paymentStatus === "paid"
                  ? "inline-flex rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success"
                  : order.paymentStatus === "failed"
                    ? "inline-flex rounded-full bg-error/15 px-3 py-1 text-xs font-semibold text-error"
                    : "inline-flex rounded-full bg-warning/15 px-3 py-1 text-xs font-semibold text-warning"
              }
            >
              Payment: {order.paymentStatus}
            </span>
          </div>
          <p className="mt-4 text-lg font-bold tabular-nums text-base-content">
            {order.totalPrice.toLocaleString()} ETB
            <span className="ml-2 text-sm font-semibold text-base-content/50">
              · commission {order.commissionAmount.toLocaleString()} ETB
            </span>
          </p>
        </div>
      </header>

      <OrderPaymentSummary order={order} payments={payments} />
      <SupplierConfirmPayment
        orderId={id}
        show={canConfirmPayment}
        paymentMethod={order.paymentMethod}
        audience="admin"
      />

      <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm ring-1 ring-base-300/20">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-base-content/50">
          Line items
        </h2>
        <ul className="mt-4 space-y-3 text-sm">
          {order.items.map((i) => {
            const p = getProduct(i.productId);
            const c = getCompany(i.companyId);
            return (
              <li
                key={`${i.productId}-${i.companyId}`}
                className="flex flex-col gap-0.5 rounded-xl border border-base-300/80 bg-base-200/20 px-3 py-2.5 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-2"
              >
                <span className="font-semibold text-base-content">
                  {p?.name ?? i.productId}
                </span>
                <span className="text-base-content/50">·</span>
                <span className="text-base-content/60">{c?.name ?? i.companyId}</span>
                <span className="text-base-content/50 sm:ml-auto tabular-nums">
                  × {i.quantity} — {i.subtotal.toLocaleString()} ETB
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
