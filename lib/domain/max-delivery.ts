import type { Product } from "@/lib/domain/types";

/**
 * Maximum units a buyer can put on one order line: the tighter of stock and
 * per-delivery max (when set). Never exceeds available quantity.
 */
export function effectiveMaxDeliveryPerOrder(
  product: Pick<Product, "maxDeliveryQuantity" | "availableQuantity">,
): number {
  const stock = Math.max(0, product.availableQuantity);
  const m = product.maxDeliveryQuantity;
  if (typeof m === "number" && m > 0 && Number.isFinite(m)) {
    return Math.min(m, stock);
  }
  return stock;
}
