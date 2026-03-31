import { ordersForMerchant } from "@/lib/db/commerce";
import { hasReviewForOrderCompany } from "@/lib/db/reviews";
import type { SessionUser } from "@/lib/domain/types";

export type CompanyReviewEligibility =
  | { kind: "guest" }
  | { kind: "not_merchant" }
  | {
      kind: "merchant";
      hasCompletedPurchase: boolean;
      /** First completed order including this company that still needs a company-level review */
      pendingReviewOrderId: string | null;
      completedPurchaseCount: number;
    };

export function getCompanyReviewEligibility(
  companyId: string,
  user: SessionUser | null,
): CompanyReviewEligibility {
  if (!user) return { kind: "guest" };
  if (user.role !== "merchant") return { kind: "not_merchant" };

  const orders = ordersForMerchant(user.id);
  const completedWithCompany = orders.filter(
    (o) =>
      o.status === "completed" &&
      o.items.some((i) => i.companyId === companyId),
  );

  if (completedWithCompany.length === 0) {
    return {
      kind: "merchant",
      hasCompletedPurchase: false,
      pendingReviewOrderId: null,
      completedPurchaseCount: 0,
    };
  }

  let pendingReviewOrderId: string | null = null;
  for (const o of completedWithCompany) {
    if (!hasReviewForOrderCompany(o.id, companyId, user.id)) {
      pendingReviewOrderId = o.id;
      break;
    }
  }

  return {
    kind: "merchant",
    hasCompletedPurchase: true,
    pendingReviewOrderId,
    completedPurchaseCount: completedWithCompany.length,
  };
}
