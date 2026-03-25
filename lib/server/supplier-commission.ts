import { companiesByOwner } from "@/lib/db/catalog";
import { listOrders } from "@/lib/db/commerce";
import { pastCommissionPaymentDeadline } from "@/lib/domain/commission-deadline";
import { isSupplierPlatformCommissionPaid } from "@/lib/domain/platform-commission";

/** Supplier must settle supplier platform commission on delivered orders or the account stays suspended for posting/editing listings (after the grace deadline). */
export function supplierHasOutstandingCommission(supplierUserId: string): boolean {
  const mine = new Set(companiesByOwner(supplierUserId).map((c) => c.id));
  return listOrders().some(
    (o) =>
      o.items.some((i) => mine.has(i.companyId)) &&
      o.status === "delivered" &&
      (o.supplierCommissionAmount ?? 0) > 0 &&
      !isSupplierPlatformCommissionPaid(o) &&
      pastCommissionPaymentDeadline(o),
  );
}
