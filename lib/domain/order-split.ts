import type { Order } from "@/lib/domain/types";

export function groupOrderLinesByCompany<T extends { companyId: string }>(
  lines: T[],
): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const line of lines) {
    const list = m.get(line.companyId) ?? [];
    list.push(line);
    m.set(line.companyId, list);
  }
  return m;
}

export function uniqueCompanyIdsOnOrder(
  order: Pick<Order, "items">,
): string[] {
  return [...new Set(order.items.map((i) => i.companyId))];
}

/** Fulfillment status is per supplier; each stored order should reference one supplier company. */
export function isSingleSupplierOrder(order: Pick<Order, "items">): boolean {
  return uniqueCompanyIdsOnOrder(order).length === 1;
}
