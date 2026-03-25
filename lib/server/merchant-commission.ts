import { listOrders } from "@/lib/db/commerce";
import { pastCommissionPaymentDeadline } from "@/lib/domain/commission-deadline";
import { isMerchantPlatformCommissionPaid } from "@/lib/domain/platform-commission";

/** Merchant must settle merchant platform commission on delivered orders or the account stays suspended for browsing/cart/checkout (after the grace deadline). */
export function merchantHasOutstandingCommission(merchantId: string): boolean {
  return listOrders().some(
    (o) =>
      o.merchantId === merchantId &&
      o.status === "delivered" &&
      o.commissionAmount > 0 &&
      !isMerchantPlatformCommissionPaid(o) &&
      pastCommissionPaymentDeadline(o),
  );
}
