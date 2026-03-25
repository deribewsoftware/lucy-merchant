import { companiesByOwner, getProduct } from "@/lib/db/catalog";
import { listOrders } from "@/lib/db/commerce";
import type { OrderStatus } from "@/lib/domain/types";

export type SupplierTopProduct = {
  productId: string;
  name: string;
  revenueEtb: number;
  unitsSold: number;
};

export type SupplierOrderStatusCount = {
  status: OrderStatus;
  count: number;
};

export type SupplierRevenueMonthPoint = {
  key: string;
  label: string;
  revenueEtb: number;
};

export type SupplierAnalytics = {
  companyCount: number;
  verifiedCompanyCount: number;
  openOrdersCount: number;
  completedOrdersCount: number;
  /** Your lines only — completed orders */
  completedRevenueEtb: number;
  /** Sum of supplier → platform fees on completed orders (your share of marketplace fees) */
  completedSupplierPlatformFeesEtb: number;
  topProducts: SupplierTopProduct[];
  /** Orders that include your line items, grouped by status */
  ordersByStatus: SupplierOrderStatusCount[];
  /** Last 6 calendar months of your completed-line revenue by order created month */
  revenueByMonth: SupplierRevenueMonthPoint[];
};

function monthKeyFromIso(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function getSupplierAnalytics(ownerId: string): SupplierAnalytics {
  const companies = companiesByOwner(ownerId);
  const companyIds = new Set(companies.map((c) => c.id));
  const orders = listOrders()
    .filter((o) => o.items.some((i) => companyIds.has(i.companyId)))
    .filter(
      (o) =>
        o.status !== "awaiting_payment" &&
        o.status !== "awaiting_bank_review",
    );

  const openOrdersCount = orders.filter(
    (o) => o.status !== "completed" && o.status !== "rejected",
  ).length;

  let completedRevenueEtb = 0;
  let completedSupplierPlatformFeesEtb = 0;
  let completedOrdersCount = 0;
  const productAgg = new Map<string, { revenue: number; units: number }>();

  for (const o of orders) {
    if (o.status !== "completed") continue;
    const lines = o.items.filter((i) => companyIds.has(i.companyId));
    if (lines.length === 0) continue;
    completedOrdersCount += 1;
    completedSupplierPlatformFeesEtb += o.supplierCommissionAmount ?? 0;
    for (const line of lines) {
      completedRevenueEtb += line.subtotal;
      const cur = productAgg.get(line.productId) ?? { revenue: 0, units: 0 };
      cur.revenue += line.subtotal;
      cur.units += line.quantity;
      productAgg.set(line.productId, cur);
    }
  }

  completedRevenueEtb = Math.round(completedRevenueEtb * 100) / 100;
  completedSupplierPlatformFeesEtb =
    Math.round(completedSupplierPlatformFeesEtb * 100) / 100;

  const topProducts: SupplierTopProduct[] = [...productAgg.entries()]
    .map(([productId, v]) => ({
      productId,
      name: getProduct(productId)?.name ?? productId,
      revenueEtb: Math.round(v.revenue * 100) / 100,
      unitsSold: v.units,
    }))
    .sort((a, b) => b.revenueEtb - a.revenueEtb)
    .slice(0, 5);

  const statusAgg = new Map<OrderStatus, number>();
  const monthRevenue = new Map<string, number>();

  for (const o of orders) {
    const touches = o.items.some((i) => companyIds.has(i.companyId));
    if (!touches) continue;
    statusAgg.set(o.status, (statusAgg.get(o.status) ?? 0) + 1);

    if (o.status !== "completed") continue;
    const lines = o.items.filter((i) => companyIds.has(i.companyId));
    if (lines.length === 0) continue;
    const mk = monthKeyFromIso(o.createdAt);
    if (!mk) continue;
    let mrev = 0;
    for (const line of lines) mrev += line.subtotal;
    monthRevenue.set(mk, (monthRevenue.get(mk) ?? 0) + mrev);
  }

  const ordersByStatus: SupplierOrderStatusCount[] = (
    [
      "pending",
      "accepted",
      "in_progress",
      "delivered",
      "completed",
      "rejected",
    ] as const
  )
    .map((status) => ({
      status,
      count: statusAgg.get(status) ?? 0,
    }))
    .filter((s) => s.count > 0);

  const now = new Date();
  const revenueByMonth: SupplierRevenueMonthPoint[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    revenueByMonth.push({
      key,
      label,
      revenueEtb:
        Math.round((monthRevenue.get(key) ?? 0) * 100) / 100,
    });
  }

  return {
    companyCount: companies.length,
    verifiedCompanyCount: companies.filter((c) => c.isVerified).length,
    openOrdersCount,
    completedOrdersCount,
    completedRevenueEtb,
    completedSupplierPlatformFeesEtb,
    topProducts,
    ordersByStatus,
    revenueByMonth,
  };
}
