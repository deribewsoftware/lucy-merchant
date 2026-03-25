import Link from "next/link";
import { notFound } from "next/navigation";
import {
  HiOutlineArrowLeft,
  HiOutlineBanknotes,
  HiOutlineBuildingOffice2,
  HiOutlineChatBubbleLeftRight,
  HiOutlineClipboardDocumentList,
  HiOutlineCube,
  HiOutlineMapPin,
  HiOutlineShieldCheck,
  HiOutlineUserCircle,
} from "react-icons/hi2";
import { AdminApproveBank } from "@/components/admin-approve-bank";
import { AdminCompleteOrder } from "@/components/admin-complete-order";
import { AdminConfirmGatewayPayment } from "@/components/admin-confirm-gateway-payment";
import { AdminRecordSupplierPlatformFee } from "@/components/admin-record-supplier-platform-fee";
import { AdminRecordSupplierPayout } from "@/components/admin-record-supplier-payout";
import { OrderFulfillmentTracker } from "@/components/order-fulfillment-tracker";
import { OrderChat } from "@/components/order-chat";
import { OrderPaymentSummary } from "@/components/order-payment-summary";
import { SupplierConfirmPayment } from "@/components/supplier-confirm-payment";
import { getPlatformBankById } from "@/lib/data/ethiopian-banks";
import { getCompany, getProduct } from "@/lib/db/catalog";
import { getOrder } from "@/lib/db/commerce";
import {
  ensureLegacyPaymentForOrder,
  listPaymentsForOrder,
} from "@/lib/db/payments";
import { findUserById } from "@/lib/db/users";
import {
  adminOrderGuidance,
  orderStatusBadgeClass,
  orderStatusLabel,
} from "@/lib/domain/order-presentations";
import { adminMayCompleteOrders } from "@/lib/server/admin-permissions";
import { getSessionUser } from "@/lib/server/session";

type Params = { params: Promise<{ id: string }> };

function merchantInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default async function AdminOrderDetailPage({ params }: Params) {
  const { id } = await params;
  const order = getOrder(id);
  if (!order) notFound();

  const viewer = await getSessionUser();
  const canAdminCompleteOrders = viewer
    ? adminMayCompleteOrders(viewer.id)
    : false;
  ensureLegacyPaymentForOrder(order);
  const payments = listPaymentsForOrder(order.id);
  const merchant = findUserById(order.merchantId);

  const hasPendingPayment = payments.some((p) => p.status === "pending");
  const canConfirmPayment =
    order.paymentStatus === "pending" &&
    hasPendingPayment &&
    order.status !== "rejected" &&
    order.status !== "awaiting_bank_review" &&
    !order.gatewayPaymentCapturedAt;

  const showApproveBank = order.status === "awaiting_bank_review";
  const showConfirmGateway =
    order.status === "awaiting_payment" &&
    Boolean(order.gatewayPaymentCapturedAt) &&
    order.paymentStatus === "pending" &&
    (order.paymentMethod === "stripe" || order.paymentMethod === "chapa");
  const showRecordSupplierPayout =
    order.status === "delivered" &&
    order.commissionAmount > 0 &&
    !(
      order.merchantCommissionPaidAt ||
      order.supplierPayoutRecordedAt
    );
  const showRecordSupplierPlatformFee =
    order.status === "delivered" &&
    (order.supplierCommissionAmount ?? 0) > 0 &&
    !order.supplierCommissionPaidAt;
  const platformBank = order.platformBankId
    ? getPlatformBankById(order.platformBankId)
    : undefined;

  const companyIds = [...new Set(order.items.map((i) => i.companyId))];
  const lineCount = order.items.length;
  const unitCount = order.items.reduce((acc, i) => acc + i.quantity, 0);
  const commissionRate =
    order.totalPrice > 0
      ? (order.commissionAmount / order.totalPrice) * 100
      : 0;

  const createdAt = new Date(order.createdAt);
  const chatClosed =
    order.status === "completed" || order.status === "rejected";

  const merchantLabel = merchant?.name ?? order.merchantId;
  const adminHint = adminOrderGuidance(order);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/admin/orders"
          className="group inline-flex w-fit items-center gap-2 text-sm font-medium text-base-content/55 transition hover:text-primary"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-base-200 text-base-content/70 transition group-hover:bg-primary/10 group-hover:text-primary">
            <HiOutlineArrowLeft className="h-4 w-4" />
          </span>
          All orders
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`badge badge-lg font-semibold capitalize ${orderStatusBadgeClass(order.status)}`}
          >
            {orderStatusLabel(order.status)}
          </span>
          <span
            className={
              order.paymentStatus === "paid"
                ? "badge badge-lg badge-success"
                : order.paymentStatus === "failed"
                  ? "badge badge-lg badge-error"
                  : "badge badge-lg badge-warning"
            }
          >
            Payment: {order.paymentStatus}
          </span>
        </div>
      </div>

      <header className="relative overflow-hidden rounded-3xl border border-base-300 bg-gradient-to-br from-base-100 via-primary/[0.06] to-secondary/[0.08] p-6 shadow-lg ring-1 ring-base-300/30 sm:p-8">
        <div
          className="pointer-events-none absolute -right-8 -top-12 h-48 w-48 rounded-full bg-primary/[0.07] blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-secondary/[0.08] blur-2xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex gap-4 sm:gap-5">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-inner sm:h-16 sm:w-16">
              <HiOutlineClipboardDocumentList className="h-7 w-7 sm:h-8 sm:w-8" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80">
                Admin · order audit
              </p>
              <h1 className="font-display mt-1 text-2xl font-bold tracking-tight text-base-content sm:text-3xl">
                Order{" "}
                <span className="text-primary">
                  {order.id.slice(0, 8).toUpperCase()}
                </span>
              </h1>
              <p className="mt-2 font-mono text-xs text-base-content/45 break-all sm:text-sm">
                {order.id}
              </p>
              <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-base-content/60">
                <span className="inline-flex items-center gap-1.5">
                  <HiOutlineShieldCheck className="h-4 w-4 text-secondary" />
                  Created {createdAt.toLocaleString()}
                </span>
                <span className="hidden text-base-content/30 sm:inline">·</span>
                <span>
                  {lineCount} line{lineCount === 1 ? "" : "s"} · {unitCount}{" "}
                  unit{unitCount === 1 ? "" : "s"}
                </span>
                <span className="hidden text-base-content/30 sm:inline">·</span>
                <span>
                  {companyIds.length} supplier
                  {companyIds.length === 1 ? "" : "s"}
                </span>
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end lg:flex-col lg:items-end">
            <p className="text-end">
              <span className="text-xs font-medium uppercase tracking-wide text-base-content/45">
                Order total
              </span>
              <span className="mt-0.5 block font-display text-3xl font-bold tabular-nums tracking-tight text-base-content sm:text-4xl">
                {order.totalPrice.toLocaleString()}{" "}
                <span className="text-lg font-semibold text-base-content/50">
                  ETB
                </span>
              </span>
            </p>
            <div className="flex flex-col gap-2 sm:items-end">
              <div className="rounded-2xl border border-base-300/80 bg-base-100/70 px-4 py-3 text-end text-sm shadow-sm backdrop-blur-sm">
                <span className="text-base-content/50">Buyer → platform</span>
                <span className="mt-0.5 block font-semibold tabular-nums text-base-content">
                  {order.commissionAmount.toLocaleString()} ETB
                  <span className="ml-2 text-xs font-normal text-base-content/45">
                    ({commissionRate.toFixed(1)}%)
                  </span>
                </span>
              </div>
              <div className="rounded-2xl border border-violet-500/25 bg-violet-500/[0.06] px-4 py-3 text-end text-sm shadow-sm backdrop-blur-sm">
                <span className="text-base-content/50">Supplier → platform</span>
                <span className="mt-0.5 block font-semibold tabular-nums text-violet-900 dark:text-violet-200">
                  {(order.supplierCommissionAmount ?? 0).toLocaleString()} ETB
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        <div className="space-y-6 lg:col-span-8">
          {adminHint ? (
            <p className="rounded-2xl border border-base-300/80 bg-base-200/30 px-4 py-3 text-sm text-base-content/75">
              {adminHint}
            </p>
          ) : null}
          <OrderFulfillmentTracker order={order} role="admin" />

          <AdminCompleteOrder
            orderId={id}
            canCompleteOrders={canAdminCompleteOrders}
            order={{
              status: order.status,
              paymentStatus: order.paymentStatus,
              commissionAmount: order.commissionAmount,
              supplierCommissionAmount: order.supplierCommissionAmount,
              merchantCommissionPaidAt: order.merchantCommissionPaidAt,
              supplierCommissionPaidAt: order.supplierCommissionPaidAt,
              supplierPayoutRecordedAt: order.supplierPayoutRecordedAt,
              merchantCommissionProofImagePath:
                order.merchantCommissionProofImagePath,
              supplierCommissionProofImagePath:
                order.supplierCommissionProofImagePath,
              commissionDeadlineAt: order.commissionDeadlineAt,
              adminCommissionProofsAcknowledgedAt:
                order.adminCommissionProofsAcknowledgedAt,
            }}
          />

          <section className="overflow-hidden rounded-3xl border border-base-300 bg-base-100 shadow-md ring-1 ring-base-300/20">
            <div className="flex flex-col gap-1 border-b border-base-300 bg-base-200/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <h2 className="flex items-center gap-2 font-display text-base font-bold text-base-content">
                <HiOutlineCube className="h-5 w-5 text-secondary" />
                Line items
              </h2>
              <p className="text-xs text-base-content/50">
                Linked products and suppliers for this checkout
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="table w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-base-300 bg-base-200/30 text-left text-[11px] font-bold uppercase tracking-wider text-base-content/45">
                    <th className="px-4 py-3 sm:px-6">Product</th>
                    <th className="px-4 py-3">Supplier</th>
                    <th className="px-4 py-3 text-center">Qty</th>
                    <th className="px-4 py-3 text-end">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((i) => {
                    const p = getProduct(i.productId);
                    const c = getCompany(i.companyId);
                    const name = p?.name ?? i.productId;
                    const desc = p?.description?.trim() ?? "";
                    return (
                      <tr
                        key={`${i.productId}-${i.companyId}`}
                        className="border-b border-base-200/80 transition hover:bg-base-200/25"
                      >
                        <td className="max-w-[min(100vw,28rem)] px-4 py-3 sm:px-6">
                          <div className="flex items-start gap-3">
                            <div className="relative mt-0.5 h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-base-300 bg-base-200">
                              {p?.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={p.imageUrl}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="flex h-full w-full items-center justify-center text-base-content/25">
                                  <HiOutlineCube className="h-5 w-5" />
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <Link
                                href={`/products/${i.productId}`}
                                className="link link-hover font-semibold text-base-content no-underline decoration-primary/0 transition hover:text-primary"
                              >
                                {name}
                              </Link>
                              {desc ? (
                                <p className="mt-1 line-clamp-2 text-xs leading-snug text-base-content/60">
                                  {desc}
                                </p>
                              ) : null}
                              <p className="mt-1 font-mono text-[10px] text-base-content/40">
                                {i.productId.slice(0, 8)}…
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="max-w-[200px] px-4 py-3">
                          <Link
                            href={`/companies/${i.companyId}`}
                            className="link-hover link font-medium text-base-content/85 no-underline hover:text-primary"
                          >
                            {c?.name ?? i.companyId}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-center tabular-nums font-semibold text-base-content">
                          {i.quantity}
                        </td>
                        <td className="px-4 py-3 text-end font-bold tabular-nums text-base-content">
                          {i.subtotal.toLocaleString()}{" "}
                          <span className="text-xs font-semibold text-base-content/45">
                            ETB
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {viewer ? (
            <section className="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-md ring-1 ring-base-300/20 sm:p-6">
              <h2 className="flex items-center gap-2 font-display text-base font-bold text-base-content">
                <HiOutlineChatBubbleLeftRight className="h-5 w-5 text-secondary" />
                Order chat
              </h2>
              <p className="mt-1 text-xs text-base-content/50">
                Moderation view — same thread visible to merchant and suppliers.
              </p>
              <div className="mt-4">
                <OrderChat
                  orderId={id}
                  viewerId={viewer.id}
                  viewerRole="admin"
                  closed={chatClosed}
                />
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-6 lg:col-span-4 lg:sticky lg:top-24">
          <div className="rounded-3xl border border-base-300 bg-gradient-to-b from-base-100 to-base-200/40 p-5 shadow-md ring-1 ring-base-300/25 sm:p-6">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-base-content/45">
              <HiOutlineUserCircle className="h-4 w-4" />
              Merchant
            </h2>
            <div className="mt-4 flex gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/15 font-display text-lg font-bold text-primary"
                aria-hidden
              >
                {merchantInitials(merchantLabel)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-bold leading-tight text-base-content">
                  {merchantLabel}
                </p>
                {merchant?.email ? (
                  <p className="mt-1 break-all text-sm text-base-content/60">
                    {merchant.email}
                  </p>
                ) : null}
                <p className="mt-2 font-mono text-[11px] text-base-content/40">
                  ID {order.merchantId}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-md ring-1 ring-base-300/20 sm:p-6">
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
                Open in Maps
              </a>
            ) : null}
          </div>

          <div className="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-md ring-1 ring-base-300/15 sm:p-6">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-base-content/45">
              <HiOutlineBuildingOffice2 className="h-4 w-4" />
              Suppliers on order
            </h2>
            <ul className="mt-3 space-y-2">
              {companyIds.map((cid) => {
                const c = getCompany(cid);
                return (
                  <li key={cid}>
                    <Link
                      href={`/companies/${cid}`}
                      className="flex items-center justify-between gap-2 rounded-xl border border-base-300/60 bg-base-200/20 px-3 py-2.5 text-sm font-medium transition hover:border-primary/30 hover:bg-primary/5"
                    >
                      <span className="truncate">{c?.name ?? cid}</span>
                      <span className="shrink-0 text-xs text-primary">View</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-base-content/45">
              <HiOutlineBanknotes className="h-4 w-4" />
              Ledger
            </div>
            <OrderPaymentSummary
              order={order}
              payments={payments}
              variant="portal"
            />
            {order.bankProofImagePath ? (
              <div className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-base-content/45">
                  Merchant payment screenshot
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={order.bankProofImagePath}
                  alt="Receipt"
                  className="mt-3 max-h-72 w-full rounded-xl border border-base-300 object-contain"
                />
              </div>
            ) : null}
            {platformBank ? (
              <div className="rounded-2xl border border-base-300 bg-base-100 p-4 text-sm shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-base-content/45">
                  Merchant selected bank
                </p>
                <p className="mt-2 font-medium text-base-content">
                  {platformBank.bankName}
                </p>
                <p className="text-base-content/70">{platformBank.accountName}</p>
                <p className="font-mono text-xs text-base-content/80">
                  {platformBank.accountNumber}
                </p>
              </div>
            ) : null}
            {showApproveBank ? <AdminApproveBank orderId={id} /> : null}
            {showConfirmGateway ? (
              <AdminConfirmGatewayPayment orderId={id} />
            ) : null}
            {showRecordSupplierPayout ? (
              <AdminRecordSupplierPayout orderId={id} />
            ) : null}
            {showRecordSupplierPlatformFee ? (
              <AdminRecordSupplierPlatformFee orderId={id} />
            ) : null}
            <SupplierConfirmPayment
              orderId={id}
              show={canConfirmPayment}
              paymentMethod={order.paymentMethod}
              audience="admin"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
