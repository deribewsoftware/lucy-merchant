import { supplierAllowedNextStatuses } from "@/lib/domain/order-flow";
import {
  isDualPlatformCommissionSettled,
  isMerchantPlatformCommissionPaid,
  isPlatformCommissionPaid,
  isSupplierPlatformCommissionPaid,
} from "@/lib/domain/platform-commission";
import type { Order, OrderStatus } from "@/lib/domain/types";

/** Merchant-facing order status — avoids “pending” vs payment “pending” confusion. */
export function merchantOrderStatusLabel(status: OrderStatus): string {
  switch (status) {
    case "pending":
      return "Awaiting supplier";
    case "awaiting_payment":
      return "Awaiting payment";
    case "awaiting_bank_review":
      return "Bank proof in review";
    case "accepted":
      return "Accepted by supplier";
    case "in_progress":
      return "In progress";
    case "delivered":
      return "Delivered";
    case "completed":
      return "Completed";
    case "rejected":
      return "Rejected";
    default:
      return orderStatusLabel(status);
  }
}

/**
 * Buyer-facing payment summary — funds go to the supplier; “Paid” when the supplier confirms (or legacy flows).
 */
export function merchantPaymentSummary(order: Order): {
  headline: string;
  sub?: string;
  tone: "success" | "warning" | "neutral" | "error";
} {
  if (order.paymentStatus === "failed") {
    return { headline: "Payment failed", tone: "error" };
  }
  if (order.status === "delivered" && !isMerchantPlatformCommissionPaid(order)) {
    return {
      headline: "Pay merchant platform commission",
      sub: "Transfer your merchant platform fee to the platform, then record it here. The supplier must also record their fee (if any) before you can complete.",
      tone: "warning",
    };
  }
  if (order.status === "delivered" && !isSupplierPlatformCommissionPaid(order)) {
    return {
      headline: "Waiting for supplier commission",
      sub: "Your merchant fee is recorded. The supplier must pay and record their supplier platform fee on this order before you can complete.",
      tone: "warning",
    };
  }
  if (order.paymentStatus === "paid") {
    return {
      headline: "Paid to supplier",
      sub: "Supplier confirmed funds or cash collection.",
      tone: "success",
    };
  }
  if (order.status === "awaiting_bank_review") {
    return {
      headline: "Legacy: admin reviewing transfer",
      sub: "Older checkout — platform verification before release.",
      tone: "warning",
    };
  }
  if (order.status === "awaiting_payment" && order.gatewayPaymentCapturedAt) {
    return {
      headline: "Card / Chapa captured",
      sub: "Awaiting admin confirmation to release to suppliers.",
      tone: "warning",
    };
  }
  if (order.status === "awaiting_payment") {
    return {
      headline: "Legacy checkout",
      sub: "Finish gateway payment or contact support.",
      tone: "warning",
    };
  }
  if (order.status === "pending" && order.paymentMethod === "bank_transfer") {
    return {
      headline: "Transfer to supplier",
      sub: "Use supplier bank on this order and upload proof.",
      tone: "warning",
    };
  }
  if (order.paymentMethod === "cod" && order.paymentStatus === "pending") {
    return {
      headline: "Cash to supplier",
      sub: "Pay the supplier when you receive the goods.",
      tone: "neutral",
    };
  }
  return {
    headline: "Pending",
    sub: "Settlement in progress.",
    tone: "neutral",
  };
}

/** Human-readable status for UI (handles multi-word statuses). */
export function orderStatusLabel(status: OrderStatus): string {
  return status.replace(/_/g, " ");
}

/** DaisyUI badge class for order lifecycle status. */
export function orderStatusBadgeClass(status: OrderStatus): string {
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
    case "awaiting_payment":
    case "awaiting_bank_review":
      return "badge-warning";
    default:
      return "badge-ghost border border-base-300";
  }
}

/** Steps shown in fulfillment timeline (after merchant payment is confirmed). */
export const FULFILLMENT_TRACKER_STEPS: readonly {
  key: string;
  label: string;
  short: string;
}[] = [
  { key: "pending", label: "New order", short: "New" },
  { key: "accepted", label: "Accepted", short: "Accepted" },
  { key: "in_progress", label: "In progress", short: "Working" },
  { key: "delivered", label: "Delivered", short: "Delivered" },
  {
    key: "platform_commission",
    label: "Platform commissions",
    short: "Fees",
  },
  { key: "completed", label: "Completed", short: "Done" },
];

/**
 * Current step index in `FULFILLMENT_TRACKER_STEPS` (0–5), or 6 when `completed`.
 * Used for the horizontal tracker (active step = min index, not yet done).
 */
export function fulfillmentTrackerSafeIndex(
  order: Pick<
    Order,
    | "status"
    | "supplierPayoutRecordedAt"
    | "merchantCommissionPaidAt"
    | "commissionAmount"
    | "supplierCommissionAmount"
    | "supplierCommissionPaidAt"
  >,
): number {
  const { status } = order;
  if (status === "completed") return 6;
  if (
    status === "awaiting_payment" ||
    status === "awaiting_bank_review" ||
    status === "rejected"
  ) {
    return 0;
  }
  switch (status) {
    case "pending":
      return 0;
    case "accepted":
      return 1;
    case "in_progress":
      return 2;
    case "delivered":
      return isDualPlatformCommissionSettled(order) ? 5 : 4;
    default:
      return 0;
  }
}

/** @deprecated Use FULFILLMENT_TRACKER_STEPS — kept for older imports */
export const FULFILLMENT_PIPELINE_STEPS: {
  status: OrderStatus;
  label: string;
  short: string;
}[] = [
  { status: "pending", label: "New order", short: "New" },
  { status: "accepted", label: "Accepted", short: "Accepted" },
  { status: "in_progress", label: "In progress", short: "Working" },
  { status: "delivered", label: "Delivered", short: "Delivered" },
  { status: "completed", label: "Completed", short: "Done" },
];

export type SupplierOrdersTab = "all" | "needs_you" | "in_flight" | "done";

/**
 * Supplier list buckets: what the row is “about” for filtering and badges.
 * Orders in `awaiting_*` are hidden from supplier lists in commerce queries.
 */
export function supplierOrderTab(
  order: Pick<Order, "status" | "paymentMethod" | "paymentStatus">,
): Exclude<SupplierOrdersTab, "all"> {
  const status = order.status;
  if (status === "completed" || status === "rejected") return "done";
  if (status === "delivered") return "in_flight";
  const allowed = supplierAllowedNextStatuses(order);
  if (allowed.length > 0) return "needs_you";
  return "in_flight";
}

export function supplierOrderMatchesTab(
  order: Pick<Order, "status" | "paymentMethod" | "paymentStatus">,
  tab: SupplierOrdersTab,
): boolean {
  if (tab === "all") return true;
  return supplierOrderTab(order) === tab;
}

/** One-line guidance for suppliers on the detail screen. */
export function supplierOrderGuidance(
  order: Pick<
    Order,
    | "status"
    | "supplierPayoutRecordedAt"
    | "merchantCommissionPaidAt"
    | "commissionAmount"
    | "supplierCommissionAmount"
    | "supplierCommissionPaidAt"
    | "paymentMethod"
    | "paymentStatus"
  >,
): string {
  const status = order.status;
  switch (status) {
    case "awaiting_payment":
    case "awaiting_bank_review":
      return "Payment is not finalized yet — you will see this order once the platform confirms payment.";
    case "pending":
      if (
        order.paymentMethod === "bank_transfer" &&
        order.paymentStatus !== "paid"
      ) {
        return "Wait for the buyer to transfer to your company account and upload proof, then confirm payment received before accepting.";
      }
      return "Accept to start work (COD: cash is collected on delivery), or reject if you cannot fulfill.";
    case "accepted":
      return "Move to in progress when you begin preparing or shipping.";
    case "in_progress":
      return "Mark delivered when the buyer has received the goods.";
    case "delivered":
      if (
        isPlatformCommissionPaid(order) &&
        isSupplierPlatformCommissionPaid(order)
      ) {
        return "Platform fees are recorded — the buyer can complete the order and leave reviews once they confirm receipt.";
      }
      if (!isPlatformCommissionPaid(order)) {
        return "The buyer pays their platform commission and records it first — then you pay yours if applicable and confirm you received payment for the goods.";
      }
      return "Pay and record your supplier platform commission on this order — then the buyer can complete after confirming they received the goods.";
    case "completed":
      return "This order is closed. Payout details appear in payment summary when recorded.";
    case "rejected":
      return "This order was declined — no further fulfillment steps.";
    default:
      return "";
  }
}

/** Admin-facing summary of what matters operationally. */
export function adminOrderGuidance(
  order: Pick<
    Order,
    | "status"
    | "supplierPayoutRecordedAt"
    | "merchantCommissionPaidAt"
    | "commissionAmount"
    | "supplierCommissionAmount"
    | "supplierCommissionPaidAt"
    | "gatewayPaymentCapturedAt"
    | "paymentMethod"
  >,
): string {
  const status = order.status;
  switch (status) {
    case "awaiting_payment":
      if (order.gatewayPaymentCapturedAt) {
        return "Gateway reported success (Stripe/Chapa) — confirm payment to notify suppliers and mark the order paid.";
      }
      return "Buyer has not finished checkout — no supplier action yet.";
    case "awaiting_bank_review":
      return "Bank proof submitted — verify amount and approve when it matches.";
    case "pending":
      return "Paid — supplier should accept or reject.";
    case "accepted":
    case "in_progress":
      return "Fulfillment in progress — monitor chat if needed.";
    case "delivered":
      if (isDualPlatformCommissionSettled(order)) {
        return "Buyer and supplier platform fees recorded — merchant can complete once supplier confirms goods payment.";
      }
      if (!isMerchantPlatformCommissionPaid(order)) {
        return "Delivered — merchant must pay and record buyer platform commission.";
      }
      return "Delivered — supplier must pay and record their platform commission before completion.";
    case "completed":
      return "Closed — commission and reviews recorded per policy.";
    case "rejected":
      return "Supplier declined — no further fulfillment.";
    default:
      return "";
  }
}

/** Short label for primary supplier actions (buttons). */
export function supplierActionButtonLabel(next: OrderStatus): string {
  switch (next) {
    case "accepted":
      return "Accept order";
    case "rejected":
      return "Reject";
    case "in_progress":
      return "Start fulfillment";
    case "delivered":
      return "Mark delivered";
    default:
      return orderStatusLabel(next);
  }
}

/** Whether this transition is the “happy path” vs decline. */
export function isSupplierPositiveTransition(to: OrderStatus): boolean {
  return to !== "rejected";
}

export type AdminOrdersTab =
  | "all"
  | "needs_platform"
  | "fulfillment"
  | "done";

export function adminOrderTab(order: Order): AdminOrdersTab {
  if (
    order.status === "awaiting_payment" ||
    order.status === "awaiting_bank_review"
  ) {
    return "needs_platform";
  }
  if (order.status === "delivered" && !isDualPlatformCommissionSettled(order)) {
    return "needs_platform";
  }
  if (order.status === "completed" || order.status === "rejected") {
    return "done";
  }
  return "fulfillment";
}

export function adminOrderMatchesTab(order: Order, tab: AdminOrdersTab): boolean {
  if (tab === "all") return true;
  return adminOrderTab(order) === tab;
}
