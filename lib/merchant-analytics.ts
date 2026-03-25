import type { Order, OrderStatus } from "@/lib/domain/types";

export type MerchantOrderStatusCount = {
  status: OrderStatus;
  count: number;
};

export type MerchantSpendMonthPoint = {
  key: string;
  label: string;
  spendEtb: number;
};

export type MerchantTopLine = {
  productId: string;
  name: string;
  spendEtb: number;
  units: number;
};

export type MerchantChartsData = {
  ordersByStatus: MerchantOrderStatusCount[];
  spendingByMonth: MerchantSpendMonthPoint[];
  topLines: MerchantTopLine[];
};

export type MerchantDashboardAnalytics = {
  charts: MerchantChartsData;
  /** Sum of order totals for completed orders */
  completedSpendEtb: number;
  /** Sum of buyer (merchant) platform fees on completed orders */
  completedCommissionEtb: number;
  /** Orders still in the workflow */
  pipelineOrderCount: number;
};

function monthKeyFromIso(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Derive chart series and headline numbers from a merchant's orders (JSON store).
 */
export function getMerchantDashboardAnalytics(
  orders: Order[],
  resolveProductName: (productId: string) => string,
): MerchantDashboardAnalytics {
  const statusAgg = new Map<OrderStatus, number>();
  const monthSpend = new Map<string, number>();
  const lineAgg = new Map<string, { spend: number; units: number }>();

  let completedSpendEtb = 0;
  let completedCommissionEtb = 0;
  let pipelineOrderCount = 0;

  for (const o of orders) {
    statusAgg.set(o.status, (statusAgg.get(o.status) ?? 0) + 1);

    if (o.status !== "completed" && o.status !== "rejected") {
      pipelineOrderCount += 1;
    }

    if (o.status === "completed") {
      completedSpendEtb += o.totalPrice;
      completedCommissionEtb += o.commissionAmount;
    }

    if (o.status === "rejected") continue;

    const mk = monthKeyFromIso(o.createdAt);
    if (mk) {
      monthSpend.set(mk, (monthSpend.get(mk) ?? 0) + o.totalPrice);
    }

    for (const line of o.items) {
      const cur = lineAgg.get(line.productId) ?? { spend: 0, units: 0 };
      cur.spend += line.subtotal;
      cur.units += line.quantity;
      lineAgg.set(line.productId, cur);
    }
  }

  completedSpendEtb = Math.round(completedSpendEtb * 100) / 100;
  completedCommissionEtb = Math.round(completedCommissionEtb * 100) / 100;

  const ordersByStatus: MerchantOrderStatusCount[] = (
    [
      "awaiting_payment",
      "awaiting_bank_review",
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
  const spendingByMonth: MerchantSpendMonthPoint[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    spendingByMonth.push({
      key,
      label,
      spendEtb: Math.round((monthSpend.get(key) ?? 0) * 100) / 100,
    });
  }

  const topLines: MerchantTopLine[] = [...lineAgg.entries()]
    .map(([productId, v]) => ({
      productId,
      name: resolveProductName(productId),
      spendEtb: Math.round(v.spend * 100) / 100,
      units: v.units,
    }))
    .sort((a, b) => b.spendEtb - a.spendEtb)
    .slice(0, 8);

  return {
    charts: {
      ordersByStatus,
      spendingByMonth,
      topLines,
    },
    completedSpendEtb,
    completedCommissionEtb,
    pipelineOrderCount,
  };
}
