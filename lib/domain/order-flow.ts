import type { OrderStatus } from "@/lib/domain/types";

/** Supplier may advance the order along this path; merchant completes after delivered. */
export function supplierAllowedNextStatuses(
  current: OrderStatus,
): OrderStatus[] {
  switch (current) {
    case "pending":
      return ["accepted", "rejected"];
    case "accepted":
      return ["in_progress", "rejected"];
    case "in_progress":
      return ["delivered", "rejected"];
    default:
      return [];
  }
}

export function isValidSupplierStatusTransition(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  return supplierAllowedNextStatuses(from).includes(to);
}

export function defaultSupplierNextChoice(
  current: OrderStatus,
): OrderStatus | null {
  const next = supplierAllowedNextStatuses(current);
  if (next.length === 0) return null;
  if (next.includes("accepted")) return "accepted";
  if (next.includes("in_progress")) return "in_progress";
  if (next.includes("delivered")) return "delivered";
  return next[0];
}
