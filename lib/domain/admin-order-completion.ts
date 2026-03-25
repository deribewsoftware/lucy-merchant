import { isDualPlatformCommissionSettled } from "@/lib/domain/platform-commission";
import type { Order } from "@/lib/domain/types";

/** Platform fees apply — admin must acknowledge reviewing proofs before completing from /admin. */
export function orderRequiresAdminProofAcknowledgment(order: Order): boolean {
  return (
    order.commissionAmount > 0 || (order.supplierCommissionAmount ?? 0) > 0
  );
}

export function canAdminCompleteOrder(order: Order): {
  ok: boolean;
  reason?: string;
} {
  if (order.status !== "delivered") {
    return { ok: false, reason: "Order must be delivered." };
  }
  if (order.paymentStatus !== "paid") {
    return {
      ok: false,
      reason:
        "Supplier must confirm payment for goods before the order can be completed.",
    };
  }
  if (!isDualPlatformCommissionSettled(order)) {
    return {
      ok: false,
      reason:
        "Both merchant and supplier platform fees must be recorded when they apply.",
    };
  }
  if (
    orderRequiresAdminProofAcknowledgment(order) &&
    !order.adminCommissionProofsAcknowledgedAt
  ) {
    return {
      ok: false,
      reason:
        "Confirm you have reviewed the commission payment screenshots, then complete.",
    };
  }
  return { ok: true };
}
