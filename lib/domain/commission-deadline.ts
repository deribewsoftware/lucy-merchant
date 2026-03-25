import type { Order } from "@/lib/domain/types";

/**
 * After delivery, unpaid commission suspends accounts only once this deadline passes.
 * Orders without `commissionDeadlineAt` (legacy) are treated as past deadline — same as
 * pre-grace behavior (suspend immediately when unpaid).
 */
export function pastCommissionPaymentDeadline(order: Order): boolean {
  if (!order.commissionDeadlineAt) return true;
  return new Date() >= new Date(order.commissionDeadlineAt);
}
