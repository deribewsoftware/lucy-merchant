import { getCategories, getProduct } from "@/lib/db/catalog";
import { listUsers } from "@/lib/db/users";
import { listOrders } from "@/lib/db/commerce";
import type { OrderStatus } from "@/lib/domain/types";

export type AdminCategoryGmv = {
  categoryId: string;
  name: string;
  gmvEtb: number;
};

export type AdminOrderStatusCount = {
  status: OrderStatus;
  count: number;
};

export type AdminGmvMonthPoint = {
  key: string;
  label: string;
  gmvEtb: number;
  commissionEtb: number;
};

export type AdminAnalytics = {
  userCount: number;
  merchantCount: number;
  supplierCount: number;
  adminCount: number;
  orderCount: number;
  completedOrderCount: number;
  openOrderCount: number;
  /** Gross merchandise value — completed orders total */
  gmvCompletedEtb: number;
  /** Sum of platform commission on completed orders */
  commissionCollectedEtb: number;
  ordersPendingPayment: number;
  topCategories: AdminCategoryGmv[];
  /** Non-zero status slices for charts */
  ordersByStatus: AdminOrderStatusCount[];
  /** Rolling window of completed-order GMV & commission by calendar month */
  gmvByMonth: AdminGmvMonthPoint[];
};

const STATUS_ORDER = [
  "pending",
  "accepted",
  "in_progress",
  "delivered",
  "completed",
  "rejected",
] as const satisfies readonly OrderStatus[];

function monthKeyFromIso(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function getAdminAnalytics(): AdminAnalytics {
  const users = listUsers();
  const orders = listOrders();
  const completed = orders.filter((o) => o.status === "completed");

  let gmvCompletedEtb = 0;
  let commissionCollectedEtb = 0;
  for (const o of completed) {
    gmvCompletedEtb += o.totalPrice;
    commissionCollectedEtb += o.commissionAmount;
  }
  gmvCompletedEtb = Math.round(gmvCompletedEtb * 100) / 100;
  commissionCollectedEtb = Math.round(commissionCollectedEtb * 100) / 100;

  const catGmv = new Map<string, number>();
  for (const o of completed) {
    for (const line of o.items) {
      const prod = getProduct(line.productId);
      if (!prod) continue;
      catGmv.set(
        prod.categoryId,
        (catGmv.get(prod.categoryId) ?? 0) + line.subtotal,
      );
    }
  }

  const categories = getCategories();
  const topCategories: AdminCategoryGmv[] = [...catGmv.entries()]
    .map(([categoryId, gmv]) => ({
      categoryId,
      name: categories.find((c) => c.id === categoryId)?.name ?? categoryId,
      gmvEtb: Math.round(gmv * 100) / 100,
    }))
    .sort((a, b) => b.gmvEtb - a.gmvEtb)
    .slice(0, 6);

  const openOrderCount = orders.filter(
    (o) => o.status !== "completed" && o.status !== "rejected",
  ).length;

  const ordersPendingPayment = orders.filter(
    (o) =>
      o.paymentStatus === "pending" &&
      o.status !== "rejected" &&
      o.status !== "completed",
  ).length;

  const statusCounts = new Map<OrderStatus, number>();
  for (const o of orders) {
    statusCounts.set(o.status, (statusCounts.get(o.status) ?? 0) + 1);
  }
  const ordersByStatus: AdminOrderStatusCount[] = STATUS_ORDER.map(
    (status) => ({
      status,
      count: statusCounts.get(status) ?? 0,
    }),
  ).filter((s) => s.count > 0);

  const monthAgg = new Map<string, { gmv: number; commission: number }>();
  for (const o of completed) {
    const mk = monthKeyFromIso(o.createdAt);
    if (!mk) continue;
    const cur = monthAgg.get(mk) ?? { gmv: 0, commission: 0 };
    cur.gmv += o.totalPrice;
    cur.commission += o.commissionAmount;
    monthAgg.set(mk, cur);
  }

  const now = new Date();
  const gmvByMonth: AdminGmvMonthPoint[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    const bucket = monthAgg.get(key) ?? { gmv: 0, commission: 0 };
    gmvByMonth.push({
      key,
      label,
      gmvEtb: Math.round(bucket.gmv * 100) / 100,
      commissionEtb: Math.round(bucket.commission * 100) / 100,
    });
  }

  return {
    userCount: users.length,
    merchantCount: users.filter((u) => u.role === "merchant").length,
    supplierCount: users.filter((u) => u.role === "supplier").length,
    adminCount: users.filter((u) => u.role === "admin").length,
    orderCount: orders.length,
    completedOrderCount: completed.length,
    openOrderCount,
    gmvCompletedEtb,
    commissionCollectedEtb,
    ordersPendingPayment,
    topCategories,
    ordersByStatus,
    gmvByMonth,
  };
}
