import type { Order } from "@/lib/domain/types";

/**
 * Dual commission: merchant platform fee and supplier platform fee are separate.
 * Completion requires both to be settled when each applies (see isDualPlatformCommissionSettled).
 */

/** Fields for merchant (buyer) → platform settlement */
export type MerchantCommissionFields = Pick<
  Order,
  "commissionAmount" | "merchantCommissionPaidAt" | "supplierPayoutRecordedAt"
>;

/** Fields for supplier → platform settlement */
export type SupplierCommissionFields = Pick<
  Order,
  "supplierCommissionAmount" | "supplierCommissionPaidAt"
>;

/**
 * Merchant obligation to the platform is satisfied when:
 * - no commission on the order, or
 * - merchant recorded payment, or
 * - legacy: supplier recorded commission before merchant-paid flow existed.
 */
export function isMerchantPlatformCommissionPaid(
  order: MerchantCommissionFields,
): boolean {
  const amt = order.commissionAmount ?? 0;
  if (amt <= 0) return true;
  if (order.merchantCommissionPaidAt) return true;
  if (order.supplierPayoutRecordedAt) return true;
  return false;
}

/**
 * Supplier obligation to the platform is satisfied when:
 * - no supplier commission on the order, or
 * - supplier recorded payment.
 */
export function isSupplierPlatformCommissionPaid(
  order: SupplierCommissionFields,
): boolean {
  const amt = order.supplierCommissionAmount ?? 0;
  if (amt <= 0) return true;
  return Boolean(order.supplierCommissionPaidAt);
}

export type DualCommissionFields = MerchantCommissionFields &
  SupplierCommissionFields;

/**
 * Both sides have settled their platform fees (when applicable).
 * Use before merchant marks order completed.
 */
export function isDualPlatformCommissionSettled(
  order: DualCommissionFields,
): boolean {
  return (
    isMerchantPlatformCommissionPaid(order) &&
    isSupplierPlatformCommissionPaid(order)
  );
}

/** @deprecated Use isMerchantPlatformCommissionPaid — name kept for existing imports */
export function isPlatformCommissionPaid(
  order: MerchantCommissionFields,
): boolean {
  return isMerchantPlatformCommissionPaid(order);
}

/**
 * Total ETB the platform has recorded for this order (buyer fee + supplier fee when each is settled).
 */
export function platformRevenueRecordedEtb(
  order: MerchantCommissionFields & SupplierCommissionFields,
): number {
  let t = 0;
  if (isMerchantPlatformCommissionPaid(order)) {
    t += order.commissionAmount ?? 0;
  }
  if (isSupplierPlatformCommissionPaid(order)) {
    t += order.supplierCommissionAmount ?? 0;
  }
  return Math.round(t * 100) / 100;
}
