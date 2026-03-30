import { getOrder, patchOrder } from "@/lib/db/commerce";
import { markPendingPaymentPaid } from "@/lib/db/payments";
import {
  notifyMerchantPaymentVerified,
  notifySuppliersNewOrder,
} from "@/lib/db/notifications";
import type { Order } from "@/lib/domain/types";

/**
 * Marks payment as received. If the order was waiting on online/bank verification,
 * moves it to `pending` and notifies suppliers. Otherwise only updates payment
 * (e.g. COD collected while fulfillment is already in progress).
 */
export function activatePaidOrder(
  orderId: string,
  transactionRef?: string,
): Order | undefined {
  const order = getOrder(orderId);
  if (!order) return undefined;

  const awaiting =
    order.status === "awaiting_payment" || order.status === "awaiting_bank_review";

  markPendingPaymentPaid(orderId, transactionRef);

  const patch: Partial<Order> = { paymentStatus: "paid" };
  if (awaiting) {
    patch.status = "pending";
  }
  const updated = patchOrder(orderId, patch);
  if (!updated) return undefined;

  if (awaiting) {
    notifySuppliersNewOrder(updated);
    notifyMerchantPaymentVerified(updated);
  }
  return updated;
}
