import {
  HiOutlineCheck,
  HiOutlineClock,
  HiOutlineShieldExclamation,
} from "react-icons/hi2";
import {
  FULFILLMENT_TRACKER_STEPS,
  fulfillmentTrackerSafeIndex,
  orderStatusLabel,
} from "@/lib/domain/order-presentations";
import {
  isMerchantPlatformCommissionPaid,
  isSupplierPlatformCommissionPaid,
} from "@/lib/domain/platform-commission";
import type { Order } from "@/lib/domain/types";

type Role = "supplier" | "admin" | "merchant";

function fulfillmentStepLabel(
  step: (typeof FULFILLMENT_TRACKER_STEPS)[number],
  role: Role,
): string {
  if (step.key !== "platform_commission") return step.label;
  if (role === "merchant") return "Merchant commission";
  if (role === "supplier") return "Supplier commission";
  return "Platform fees";
}

function fulfillmentStepShort(
  step: (typeof FULFILLMENT_TRACKER_STEPS)[number],
  role: Role,
): string {
  if (step.key !== "platform_commission") return step.short;
  if (role === "merchant") return "Merchant";
  if (role === "supplier") return "Supplier";
  return "Fees";
}

type Props = {
  order: Pick<
    Order,
    | "status"
    | "supplierPayoutRecordedAt"
    | "merchantCommissionPaidAt"
    | "commissionAmount"
    | "gatewayPaymentCapturedAt"
    | "supplierCommissionAmount"
    | "supplierCommissionPaidAt"
  >;
  /** Supplier copy is shorter; admin references platform duties; merchant is buyer-facing. */
  role?: Role;
};

export function OrderFulfillmentTracker({ order, role = "admin" }: Props) {
  const status = order.status;

  if (status === "awaiting_payment") {
    const gatewayCaptured = Boolean(order.gatewayPaymentCapturedAt);
    return (
      <div className="rounded-2xl border border-warning/30 bg-warning/5 p-4 sm:p-5">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/20 text-warning">
            <HiOutlineClock className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-sm font-bold text-warning">
              {gatewayCaptured
                ? "Payment received — platform confirmation"
                : "Awaiting merchant payment"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-base-content/60">
              {gatewayCaptured
                ? role === "merchant"
                  ? "Your card or Chapa payment was captured. We’ll confirm shortly; suppliers start after approval and you’ll see Paid then."
                  : role === "supplier"
                    ? "The buyer paid online — the platform will confirm before this order reaches you."
                    : "Gateway reported success — confirm payment in the ledger to notify suppliers and mark the order paid for the buyer."
                : role === "supplier"
                  ? "You will be notified here once checkout is paid and the order becomes actionable."
                  : role === "merchant"
                    ? "Finish payment so suppliers can see and fulfill this order."
                    : "The buyer has not finished paying yet. Suppliers are not notified until funds are confirmed."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "awaiting_bank_review") {
    return (
      <div className="rounded-2xl border border-warning/30 bg-warning/5 p-4 sm:p-5">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/20 text-warning">
            <HiOutlineShieldExclamation className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-sm font-bold text-warning">
              Bank transfer under review
            </p>
            <p className="mt-1 text-xs leading-relaxed text-base-content/60">
              {role === "supplier"
                ? "An admin must approve the proof before this order appears in your active queue."
                : role === "merchant"
                  ? "We are verifying your transfer. Suppliers start after approval."
                  : "A screenshot was submitted. Approve from the ledger when the transfer matches the order total."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="rounded-2xl border border-error/25 bg-error/5 p-4 sm:p-5">
        <p className="font-display text-sm font-bold text-error">
          Order rejected
        </p>
        <p className="mt-1 text-xs leading-relaxed text-base-content/60">
          {role === "supplier"
            ? "You declined this request (or it was closed). No further fulfillment steps apply."
            : role === "merchant"
              ? "This order was declined or closed."
              : "This request was declined. Fulfillment and payment flows are halted for this record."}
        </p>
      </div>
    );
  }

  const steps = FULFILLMENT_TRACKER_STEPS;
  const safeIdx = fulfillmentTrackerSafeIndex(order);
  const last = steps.length - 1;
  const trackPct =
    status === "completed"
      ? 100
      : last > 0
        ? Math.min(100, Math.round((safeIdx / last) * 100))
        : 0;

  return (
    <div className="rounded-2xl border border-base-300 bg-base-100/80 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-base-content/45">
          {role === "supplier"
            ? "Your fulfillment & supplier fee"
            : role === "merchant"
              ? "Order progress & merchant fee"
              : "Fulfillment & platform fees"}
        </p>
        <span className="text-[11px] font-mono tabular-nums text-base-content/40">
          {trackPct}% · {orderStatusLabel(status)}
        </span>
      </div>
      <div className="relative mt-5 px-2 sm:px-3">
        <div
          className="absolute start-9 end-9 top-[17px] h-1 rounded-full bg-base-300 sm:start-10 sm:end-10"
          aria-hidden
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
            style={{ width: `${trackPct}%` }}
            aria-hidden
          />
        </div>
        <ol className="relative flex justify-between">
          {steps.map((step, i) => {
            const isComplete =
              status === "completed" || i < safeIdx;
            const isCurrent =
              status !== "completed" && i === safeIdx;
            const stepLabel = fulfillmentStepLabel(step, role);
            const stepShort = fulfillmentStepShort(step, role);

            return (
              <li
                key={step.key}
                className="flex w-0 flex-1 flex-col items-center"
              >
                <div
                  className={`relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm transition ${
                    isComplete
                      ? "bg-primary text-primary-content"
                      : isCurrent
                        ? "bg-warning/25 text-warning ring-2 ring-warning/50 ring-offset-2 ring-offset-base-100"
                        : "bg-base-200 text-base-content/35"
                  }`}
                >
                  {isComplete ? (
                    <HiOutlineCheck className="h-4 w-4 stroke-[2.5]" />
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </div>
                <span
                  className={`mt-3 max-w-[4.75rem] text-center text-[10px] font-semibold leading-snug sm:max-w-[6rem] sm:text-xs ${
                    isCurrent
                      ? "text-base-content"
                      : isComplete
                        ? "text-base-content/80"
                        : "text-base-content/40"
                  }`}
                >
                  <span className="sm:hidden">{stepShort}</span>
                  <span className="hidden sm:inline">{stepLabel}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      {(status === "delivered" || status === "completed") &&
        (role === "admin" ||
          (role === "merchant" && (order.commissionAmount ?? 0) > 0) ||
          (role === "supplier" &&
            (order.supplierCommissionAmount ?? 0) > 0)) ? (
        <div className="mt-4 rounded-xl border border-base-300/90 bg-base-200/25 px-3 py-3 sm:px-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-base-content/45">
            {role === "merchant"
              ? "Your merchant platform commission"
              : role === "supplier"
                ? "Your supplier platform commission"
                : "Platform commissions on this order"}
          </p>
          <div className="mt-2 space-y-2">
            {(role === "merchant" || role === "admin") &&
            (order.commissionAmount ?? 0) > 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-base-content/80">
                  {role === "admin" ? "Merchant fee" : "Amount"}
                </span>
                <span className="font-semibold tabular-nums text-base-content">
                  {order.commissionAmount.toLocaleString()} ETB
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    isMerchantPlatformCommissionPaid(order)
                      ? "bg-success/15 text-success"
                      : "bg-warning/25 text-warning"
                  }`}
                >
                  {isMerchantPlatformCommissionPaid(order) ? "Paid" : "Pending"}
                </span>
              </div>
            ) : null}
            {(role === "supplier" || role === "admin") &&
            (order.supplierCommissionAmount ?? 0) > 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-base-content/80">
                  {role === "admin" ? "Supplier fee" : "Amount"}
                </span>
                <span className="font-semibold tabular-nums text-base-content">
                  {(order.supplierCommissionAmount ?? 0).toLocaleString()} ETB
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    isSupplierPlatformCommissionPaid(order)
                      ? "bg-success/15 text-success"
                      : "bg-warning/25 text-warning"
                  }`}
                >
                  {isSupplierPlatformCommissionPaid(order)
                    ? "Paid"
                    : "Pending"}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      {status === "delivered" &&
      (!isMerchantPlatformCommissionPaid(order) ||
        !isSupplierPlatformCommissionPaid(order)) ? (
        <p className="mt-4 rounded-xl border border-info/25 bg-info/5 px-3 py-2 text-xs leading-relaxed text-base-content/70">
          {!isMerchantPlatformCommissionPaid(order)
            ? role === "merchant"
              ? "Pay your buyer platform commission and record it here — then the supplier records their fee (if any) and confirms they received payment for the goods."
              : role === "supplier"
                ? "The buyer pays their platform commission after delivery. Once that is recorded, pay yours if applicable and confirm buyer payment."
                : "Delivered — buyer platform commission must be recorded before completion."
            : !isSupplierPlatformCommissionPaid(order)
              ? role === "merchant"
                ? "Your commission is recorded. Wait for the supplier to pay and record their platform fee (if any) before you can complete."
                : role === "supplier"
                  ? "Pay and record your supplier platform commission on this order so the buyer can complete."
                  : "Delivered — supplier platform commission still pending (if configured)."
              : null}
        </p>
      ) : null}
    </div>
  );
}
