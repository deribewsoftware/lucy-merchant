import { randomUUID } from "crypto";
import type { NotificationRecord, Order } from "@/lib/domain/types";
import { getCompany, getProduct } from "@/lib/db/catalog";
import { findUserById } from "@/lib/db/users";
import { readJsonFile, writeJsonFile } from "@/lib/store/json-file";

const FILE = "notifications.json";
const MAX_ROWS = 2500;

function load(): NotificationRecord[] {
  return readJsonFile<NotificationRecord[]>(FILE, []);
}

function save(rows: NotificationRecord[]) {
  writeJsonFile(FILE, rows);
}

function trim(rows: NotificationRecord[]): NotificationRecord[] {
  if (rows.length <= MAX_ROWS) return rows;
  return rows
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, MAX_ROWS);
}

export function createNotification(input: {
  userId: string;
  kind: NotificationRecord["kind"];
  title: string;
  body: string;
  href?: string;
}): NotificationRecord {
  const rows = load();
  const n: NotificationRecord = {
    id: randomUUID(),
    userId: input.userId,
    kind: input.kind,
    title: input.title,
    body: input.body,
    href: input.href,
    read: false,
    createdAt: new Date().toISOString(),
  };
  rows.push(n);
  save(trim(rows));
  return n;
}

export function listNotificationsForUser(
  userId: string,
  limit: number,
): NotificationRecord[] {
  return load()
    .filter((r) => r.userId === userId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, limit);
}

export function unreadCountForUser(userId: string): number {
  return load().filter((r) => r.userId === userId && !r.read).length;
}

export function markNotificationRead(
  userId: string,
  notificationId: string,
): boolean {
  const rows = load();
  const i = rows.findIndex(
    (r) => r.id === notificationId && r.userId === userId,
  );
  if (i === -1) return false;
  rows[i] = { ...rows[i], read: true };
  save(rows);
  return true;
}

export function markAllReadForUser(userId: string): void {
  const rows = load().map((r) =>
    r.userId === userId ? { ...r, read: true } : r,
  );
  save(rows);
}

/** PDF: notify suppliers with lines on this order */
export function notifySuppliersNewOrder(order: Order): void {
  const merchant = findUserById(order.merchantId);
  const label = merchant?.name ?? "A merchant";
  const seen = new Set<string>();
  for (const line of order.items) {
    const co = getCompany(line.companyId);
    if (!co || seen.has(co.ownerId)) continue;
    seen.add(co.ownerId);
    createNotification({
      userId: co.ownerId,
      kind: "order_new",
      title: "New order",
      body: `${label} placed order ${order.totalPrice.toLocaleString()} ETB — review in your workspace.`,
      href: `/supplier/orders/${order.id}`,
    });
  }
}

export function notifyMerchantOrderStatus(
  order: Order,
  status: Order["status"],
): void {
  const line = `Status: ${status.replace(/_/g, " ")}`;
  createNotification({
    userId: order.merchantId,
    kind: "order_status",
    title: "Order update",
    body: `Your order was updated. ${line}.`,
    href: `/merchant/orders/${order.id}`,
  });
}

/** When merchant completes (or other merchant-side events), ping involved suppliers */
export function notifySuppliersOrderStatus(
  order: Order,
  status: Order["status"],
): void {
  const line = status.replace(/_/g, " ");
  const seen = new Set<string>();
  for (const item of order.items) {
    const co = getCompany(item.companyId);
    if (!co || seen.has(co.ownerId)) continue;
    seen.add(co.ownerId);
    createNotification({
      userId: co.ownerId,
      kind: "order_status",
      title: "Order update",
      body: `A shared order moved to: ${line}.`,
      href: `/supplier/orders/${order.id}`,
    });
  }
}

export function notifyOrderChatRecipients(
  order: Order,
  senderId: string,
  preview: string,
): void {
  const snippet =
    preview.length > 120 ? `${preview.slice(0, 117)}…` : preview;
  if (order.merchantId !== senderId) {
    createNotification({
      userId: order.merchantId,
      kind: "chat_message",
      title: "New order message",
      body: snippet,
      href: `/merchant/orders/${order.id}`,
    });
    return;
  }
  const seen = new Set<string>();
  for (const line of order.items) {
    const co = getCompany(line.companyId);
    if (!co || seen.has(co.ownerId)) continue;
    seen.add(co.ownerId);
    createNotification({
      userId: co.ownerId,
      kind: "chat_message",
      title: "New order message",
      body: snippet,
      href: `/supplier/orders/${order.id}`,
    });
  }
}

export function notifyCompanyReviewPosted(
  companyId: string,
  rating: number,
  preview: string,
): void {
  const co = getCompany(companyId);
  if (!co) return;
  const body =
    preview.length > 100 ? `${preview.slice(0, 97)}…` : preview;
  createNotification({
    userId: co.ownerId,
    kind: "review_company",
    title: `New ${rating}★ company review`,
    body,
    href: `/supplier/companies`,
  });
}

export function notifyProductReviewPosted(
  productId: string,
  rating: number,
  preview: string,
): void {
  const p = getProduct(productId);
  if (!p) return;
  const co = getCompany(p.companyId);
  if (!co) return;
  const body =
    preview.length > 100 ? `${preview.slice(0, 97)}…` : preview;
  createNotification({
    userId: co.ownerId,
    kind: "review_product",
    title: `New ${rating}★ product review`,
    body,
    href: `/products/${productId}`,
  });
}
