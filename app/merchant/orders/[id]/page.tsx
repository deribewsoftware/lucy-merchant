import Link from "next/link";
import { notFound } from "next/navigation";
import {
  HiOutlineArrowLeft,
  HiOutlineChatBubbleLeftRight,
  HiOutlineClipboardDocumentList,
  HiOutlineMapPin,
} from "react-icons/hi2";
import { CompanyReviewForms } from "@/components/company-review-forms";
import { MerchantCompleteOrder } from "@/components/merchant-complete-order";
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
import type { OrderStatus } from "@/lib/domain/types";
import { getSessionUser } from "@/lib/server/session";

type Params = { params: Promise<{ id: string }> };

function statusBadgeClass(status: OrderStatus): string {
  switch (status) {
    case "completed":
      return "badge-success";
    case "rejected":
      return "badge-error";
    case "delivered":
      return "badge-info";
    case "in_progress":
      return "badge-warning";
    case "accepted":
      return "badge-secondary";
    default:
      return "badge-ghost border border-base-300";
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

  return (
    <div className="space-y-8">
      <Link
        href="/merchant/orders"
        className="inline-flex items-center gap-2 text-sm font-medium text-base-content/60 transition hover:text-primary"
      >
        <HiOutlineArrowLeft className="h-4 w-4" />
        Back to orders
      </Link>

      <header className="relative overflow-hidden rounded-2xl border border-base-300 bg-gradient-to-br from-base-100 via-secondary/[0.04] to-primary/[0.05] p-6 sm:p-7">
        <div
          className="pointer-events-none absolute -right-4 -top-4 h-28 w-28 text-primary/10"
          aria-hidden
        >
          <svg viewBox="0 0 96 96" fill="none" className="h-full w-full">
            <rect
              x="16"
              y="20"
              width="64"
              height="56"
              rx="8"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <path
              d="M32 40h32M32 52h20"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="relative flex flex-wrap items-start gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <HiOutlineClipboardDocumentList className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-bold tracking-tight text-base-content">
              Order detail
            </h1>
            <p className="mt-1 font-mono text-xs text-base-content/50">
              {order.id}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={`badge capitalize ${statusBadgeClass(order.status)}`}
              >
                {order.status.replace("_", " ")}
              </span>
            </div>
            <p className="mt-4 flex items-start gap-2 text-sm text-base-content/70">
              <HiOutlineMapPin className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
              <span>{order.deliveryLocation}</span>
            </p>
            {order.deliveryLocation.trim() ? (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryLocation.trim())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex text-sm font-medium text-primary underline-offset-2 hover:underline"
              >
                Open in Google Maps
              </a>
            ) : null}
            <p className="mt-3 text-base font-semibold text-base-content">
              {order.totalPrice.toLocaleString()} ETB
              <span className="mx-2 font-normal text-base-content/45">·</span>
              commission {order.commissionAmount.toLocaleString()} ETB
            </p>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm ring-1 ring-base-300/15">
        <OrderPaymentSummary order={order} payments={payments} />
      </section>

      <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm ring-1 ring-base-300/15">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-base-content">
          <HiOutlineClipboardDocumentList className="h-4 w-4 text-secondary" />
          Line items
        </h2>
        <ul className="mt-4 space-y-2 text-sm">
          {order.items.map((i) => {
            const p = getProduct(i.productId);
            return (
              <li
                key={i.productId}
                className="flex flex-wrap justify-between gap-2 border-b border-base-200 py-2 last:border-0"
              >
                <Link
                  href={`/products/${i.productId}`}
                  className="link link-hover font-medium text-primary no-underline"
                >
                  {p?.name ?? i.productId}
                </Link>
                <span className="text-base-content/65">
                  × {i.quantity} — {i.subtotal.toLocaleString()} ETB
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm ring-1 ring-base-300/15">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-base-content">
          <HiOutlineChatBubbleLeftRight className="h-4 w-4 text-secondary" />
          Order chat
        </h2>
        <div className="mt-4">
          <OrderChat orderId={id} viewerId={user.id} closed={chatClosed} />
        </div>
      </section>

      {order.status === "delivered" && (
        <MerchantCompleteOrder orderId={id} />
      )}

      {order.status === "completed" && (
        <>
          <CompanyReviewForms orderId={id} companies={companies} />
          <ProductReviewForms orderId={id} products={reviewProducts} />
        </>
      )}
    </div>
  );
}
