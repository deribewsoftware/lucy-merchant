import {
  addBusinessDays,
  parseOrderDate,
} from "@/lib/domain/delivery-business-days";
import type { Order } from "@/lib/domain/types";

function deliveryCommitmentDaysForOrder(order: Order): number {
  if (
    typeof order.deliveryCommitmentBusinessDays === "number" &&
    order.deliveryCommitmentBusinessDays > 0
  ) {
    return order.deliveryCommitmentBusinessDays;
  }
  return 7;
}

function fulfillmentClockStart(order: Order): Date | null {
  const a = parseOrderDate(order.fulfillmentAcceptedAt);
  if (a) return a;
  if (order.status === "accepted" || order.status === "in_progress") {
    return parseOrderDate(order.createdAt);
  }
  return null;
}

/** Delivery SLA deadline (end of last business day in the window). */
export function orderFulfillmentDeliveryDeadline(order: Order): Date | null {
  const start = fulfillmentClockStart(order);
  if (!start) return null;
  const days = deliveryCommitmentDaysForOrder(order);
  return addBusinessDays(start, days);
}

export function isOrderDeliveryOverdue(order: Order): boolean {
  if (
    order.status !== "accepted" &&
    order.status !== "in_progress"
  ) {
    return false;
  }
  const deadline = orderFulfillmentDeliveryDeadline(order);
  if (!deadline) return false;
  return Date.now() > deadline.getTime();
}

export function merchantMayOpenDeliveryDispute(order: Order): boolean {
  if (order.merchantDisputeOpenedAt) return false;
  if (
    order.status === "completed" ||
    order.status === "rejected" ||
    order.status === "delivered"
  ) {
    return false;
  }
  if (
    order.status === "awaiting_payment" ||
    order.status === "awaiting_bank_review"
  ) {
    return false;
  }
  return isOrderDeliveryOverdue(order);
}
