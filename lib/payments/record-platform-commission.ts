import { getOrder, patchOrder } from "@/lib/db/commerce";
import {
  isMerchantPlatformCommissionPaid,
  isSupplierPlatformCommissionPaid,
  platformRevenueRecordedEtb,
} from "@/lib/domain/platform-commission";
import {
  notifyMerchantSupplierCommissionRecorded,
  notifyMerchantSupplierPayoutReleased,
  notifySuppliersPayoutRecorded,
} from "@/lib/db/notifications";
import type { Order } from "@/lib/domain/types";

/** Merchant or admin records that buyer → platform commission for this delivered order is paid. */
export function recordMerchantPlatformCommission(
  orderId: string,
  opts?: { proofImagePath?: string },
): Order | undefined {
  const order = getOrder(orderId);
  if (!order || order.status !== "delivered" || isMerchantPlatformCommissionPaid(order)) {
    return undefined;
  }
  const iso = new Date().toISOString();
  const merged: Order = {
    ...order,
    merchantCommissionPaidAt: iso,
    ...(opts?.proofImagePath
      ? { merchantCommissionProofImagePath: opts.proofImagePath }
      : {}),
  };
  const updated = patchOrder(orderId, {
    merchantCommissionPaidAt: iso,
    ...(opts?.proofImagePath
      ? { merchantCommissionProofImagePath: opts.proofImagePath }
      : {}),
    supplierNetPayoutEtb: platformRevenueRecordedEtb(merged),
  });
  if (updated) {
    notifyMerchantSupplierPayoutReleased(updated);
    notifySuppliersPayoutRecorded(updated);
  }
  return updated;
}

/** Supplier or admin records supplier → platform commission for this delivered order. */
export function recordSupplierPlatformCommission(
  orderId: string,
  opts?: { proofImagePath?: string },
): Order | undefined {
  const order = getOrder(orderId);
  if (!order || order.status !== "delivered" || isSupplierPlatformCommissionPaid(order)) {
    return undefined;
  }
  const owed = Math.round((order.supplierCommissionAmount ?? 0) * 100) / 100;
  if (owed <= 0) return undefined;
  const iso = new Date().toISOString();
  const merged: Order = {
    ...order,
    supplierCommissionPaidAt: iso,
    ...(opts?.proofImagePath
      ? { supplierCommissionProofImagePath: opts.proofImagePath }
      : {}),
  };
  const updated = patchOrder(orderId, {
    supplierCommissionPaidAt: iso,
    ...(opts?.proofImagePath
      ? { supplierCommissionProofImagePath: opts.proofImagePath }
      : {}),
    supplierNetPayoutEtb: platformRevenueRecordedEtb(merged),
  });
  if (updated) {
    notifyMerchantSupplierCommissionRecorded(updated);
  }
  return updated;
}

/** @deprecated Alias — commission is recorded as merchant-paid. */
export function recordPlatformCommissionReceived(orderId: string): Order | undefined {
  return recordMerchantPlatformCommission(orderId);
}
