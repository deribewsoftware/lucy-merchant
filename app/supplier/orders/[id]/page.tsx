import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderChat } from "@/components/order-chat";
import { OrderPaymentSummary } from "@/components/order-payment-summary";
import { SupplierConfirmPayment } from "@/components/supplier-confirm-payment";
import { SupplierOrderActions } from "@/components/supplier-order-actions";
import { companiesByOwner, getProduct } from "@/lib/db/catalog";
import { getOrder } from "@/lib/db/commerce";
import {
  ensureLegacyPaymentForOrder,
  listPaymentsForOrder,
} from "@/lib/db/payments";
import { getSessionUser } from "@/lib/server/session";

type Params = { params: Promise<{ id: string }> };

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

  const chatClosed =
    order.status === "completed" || order.status === "rejected";

  ensureLegacyPaymentForOrder(order);
  const payments = listPaymentsForOrder(order.id);
  const hasPendingPayment = payments.some((p) => p.status === "pending");
  const canConfirmPayment =
    order.paymentStatus === "pending" &&
    hasPendingPayment &&
    order.status !== "rejected";

  return (
    <div className="space-y-8">
      <Link
        href="/supplier/orders"
        className="link link-primary text-sm no-underline hover:underline"
      >
        ← Back to orders
      </Link>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-base-content">Order detail</h1>
          <p className="font-mono text-xs text-base-content/50">{order.id}</p>
          <p className="mt-2 text-sm text-base-content/70">{order.deliveryLocation}</p>
          {order.deliveryLocation.trim() ? (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryLocation.trim())}`}
              target="_blank"
              rel="noopener noreferrer"
              className="link link-primary mt-2 inline-block text-sm font-medium no-underline hover:underline"
            >
              Open delivery address in Google Maps
            </a>
          ) : null}
          <p className="mt-1 text-sm font-semibold text-base-content">
            {order.totalPrice.toLocaleString()} ETB
          </p>
        </div>
        <SupplierOrderActions orderId={id} current={order.status} />
      </header>

      <OrderPaymentSummary order={order} payments={payments} />
      <SupplierConfirmPayment
        orderId={id}
        show={canConfirmPayment}
        paymentMethod={order.paymentMethod}
      />

      <ul className="space-y-2 text-sm text-base-content/80">
        {order.items.map((i) => {
          const p = getProduct(i.productId);
          const isYours = mine.has(i.companyId);
          return (
            <li key={`${i.productId}-${i.companyId}`}>
              {p?.name ?? i.productId} × {i.quantity}
              {!isYours && (
                <span className="ml-2 text-xs text-base-content/50">
                  (another supplier)
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <OrderChat
        orderId={id}
        viewerId={user.id}
        closed={chatClosed}
      />
    </div>
  );
}
