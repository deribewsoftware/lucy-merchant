import type { Company } from "@/lib/domain/types";
import { listOrders } from "@/lib/db/commerce";

/** Completed order line quantity per company (PDF: top companies + order volume). */
export function completedUnitsByCompany(): Map<string, number> {
  const map = new Map<string, number>();
  for (const order of listOrders()) {
    if (order.status !== "completed") continue;
    for (const line of order.items) {
      map.set(line.companyId, (map.get(line.companyId) ?? 0) + line.quantity);
    }
  }
  return map;
}

export function sortCompaniesByReputationAndVolume(
  companies: Company[],
  volume: Map<string, number>,
): Company[] {
  return [...companies].sort((a, b) => {
    const va = volume.get(a.id) ?? 0;
    const vb = volume.get(b.id) ?? 0;
    if (vb !== va) return vb - va;
    if (b.ratingAverage !== a.ratingAverage) {
      return b.ratingAverage - a.ratingAverage;
    }
    return b.totalReviews - a.totalReviews;
  });
}
