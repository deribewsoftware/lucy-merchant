import { companiesByOwner } from "@/lib/db/catalog";
import type { Order, SessionUser } from "@/lib/domain/types";

export function canAccessOrder(user: SessionUser, order: Order): boolean {
  if (user.role === "admin") return true;
  if (user.role === "merchant") return order.merchantId === user.id;
  if (user.role === "supplier") {
    if (
      order.status === "awaiting_payment" ||
      order.status === "awaiting_bank_review"
    ) {
      return false;
    }
    const mine = new Set(companiesByOwner(user.id).map((c) => c.id));
    return order.items.some((i) => mine.has(i.companyId));
  }
  return false;
}
