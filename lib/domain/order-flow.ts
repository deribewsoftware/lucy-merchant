import type { Order, OrderStatus } from "@/lib/domain/types";

type OrderSlice = Pick<
  Order,
  "status" | "paymentMethod" | "paymentStatus"
>;

function withoutRejectIfPaymentConfirmed(
  order: OrderSlice,
  statuses: OrderStatus[],
): OrderStatus[] {
  if (order.paymentStatus !== "paid") return statuses;
  return statuses.filter((s) => s !== "rejected");
}

/**
 * Supplier may advance the order along this path after the buyer has paid (when bank transfer is required).
 * COD: accept while payment is still pending (cash collected on delivery).
 * After the supplier confirms payment received, rejection is not allowed (buyer funds are committed).
 * After delivery, the merchant records buyer platform commission and the supplier records
 * their platform fee (when configured); the supplier confirms buyer payment; then the buyer
 * can complete and leave reviews.
 */
export function supplierAllowedNextStatuses(order: OrderSlice): OrderStatus[] {
  const current = order.status;
  switch (current) {
    case "awaiting_payment":
    case "awaiting_bank_review":
      return [];
    case "pending": {
      if (
        order.paymentMethod === "bank_transfer" &&
        order.paymentStatus !== "paid"
      ) {
        return [];
      }
      return withoutRejectIfPaymentConfirmed(order, ["accepted", "rejected"]);
    }
    case "accepted":
      return withoutRejectIfPaymentConfirmed(order, [
        "in_progress",
        "rejected",
      ]);
    case "in_progress":
      return withoutRejectIfPaymentConfirmed(order, ["delivered", "rejected"]);
    default:
      return [];
  }
}

export function isValidSupplierStatusTransition(
  order: OrderSlice,
  to: OrderStatus,
): boolean {
  return supplierAllowedNextStatuses(order).includes(to);
}

export function defaultSupplierNextChoice(
  order: OrderSlice,
): OrderStatus | null {
  const next = supplierAllowedNextStatuses(order);
  if (next.length === 0) return null;
  if (next.includes("accepted")) return "accepted";
  if (next.includes("in_progress")) return "in_progress";
  if (next.includes("delivered")) return "delivered";
  return next[0];
}
