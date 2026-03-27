import { randomUUID } from "crypto";
import type { NotificationRecord, Order } from "@/lib/domain/types";
import { getCompany, getProduct } from "@/lib/db/catalog";
import { findUserById, listUsers } from "@/lib/db/users";
import {
  isSendGridMirrorChatEnabled,
  queueInAppNotificationEmail,
} from "@/lib/email/mirror-in-app-notification";
import {
  isMerchantPlatformCommissionPaid,
  isSupplierPlatformCommissionPaid,
} from "@/lib/domain/platform-commission";
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
export function notifyAdmins(input: {
  title: string;
  body: string;
  href?: string;
}): void {
  for (const u of listUsers()) {
    if (u.role !== "admin") continue;
    createNotification({
      userId: u.id,
      kind: "order_admin",
      title: input.title,
      body: input.body,
      href: input.href,
    });
    queueInAppNotificationEmail(u.id, input.title, input.body, input.href);
  }
}

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
    queueInAppNotificationEmail(
      co.ownerId,
      "New order",
      `${label} placed order ${order.totalPrice.toLocaleString()} ETB — review in your workspace.`,
      `/supplier/orders/${order.id}`,
    );
  }
}

/** Buyer confirmation: one in-app + optional email per supplier split order */
/** Stripe/Chapa webhook recorded payment — merchant + admins (first capture only; callers dedupe). */
export function notifyMerchantGatewayCaptureRecorded(order: Order): void {
  if (order.paymentMethod !== "stripe" && order.paymentMethod !== "chapa") return;
  const short = order.id.slice(0, 8);
  const label = order.paymentMethod === "stripe" ? "card (Stripe)" : "Chapa";
  const title = "Payment received";
  const body = `We received your ${label} payment for order ${short}… (${order.totalPrice.toLocaleString()} ETB). An administrator will confirm your order shortly.`;
  createNotification({
    userId: order.merchantId,
    kind: "order_status",
    title,
    body,
    href: `/merchant/orders/${order.id}`,
  });
  queueInAppNotificationEmail(
    order.merchantId,
    title,
    body,
    `/merchant/orders/${order.id}`,
  );
}

export function notifyAdminsGatewayCaptureRecorded(order: Order): void {
  if (order.paymentMethod !== "stripe" && order.paymentMethod !== "chapa") return;
  notifyAdmins({
    title: "Gateway payment captured",
    body: `Order ${order.id.slice(0, 8)}… (${order.totalPrice.toLocaleString()} ETB) — ${order.paymentMethod}. Confirm payment in admin when ready.`,
    href: `/admin/orders/${order.id}`,
  });
}

export function notifyMerchantOrderPlaced(order: Order): void {
  const lineSummary = order.items
    .map((i) => {
      const p = getProduct(i.productId);
      const name = p?.name ?? "Product";
      return `• ${name} × ${i.quantity} — ${i.subtotal.toLocaleString()} ETB`;
    })
    .join("\n");
  const short = order.id.slice(0, 8);
  const title = "Order placed";
  const body = `Order ${short}… — ${order.totalPrice.toLocaleString()} ETB total.\n${lineSummary}`;
  createNotification({
    userId: order.merchantId,
    kind: "order_new",
    title,
    body,
    href: `/merchant/orders/${order.id}`,
  });
  queueInAppNotificationEmail(
    order.merchantId,
    title,
    body,
    `/merchant/orders/${order.id}`,
  );
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
  queueInAppNotificationEmail(
    order.merchantId,
    "Order update",
    `Your order was updated. ${line}.`,
    `/merchant/orders/${order.id}`,
  );
}

/** When merchant completes (or other merchant-side events), ping involved suppliers */
export function notifyAdminsOrderDelivered(order: Order): void {
  notifyAdmins({
    title: "Order delivered",
    body: `Order ${order.id.slice(0, 8)}… marked delivered — ${order.totalPrice.toLocaleString()} ETB.`,
    href: `/admin/orders/${order.id}`,
  });
}

/** Remind merchant / suppliers to pay platform commission after delivery (before grace ends). */
export function notifyCommissionDueOnDelivery(order: Order): void {
  const short = order.id.slice(0, 8);
  const hrefM = `/merchant/orders/${order.id}`;
  const hrefS = `/supplier/orders/${order.id}`;

  if (
    order.commissionAmount > 0 &&
    !isMerchantPlatformCommissionPaid(order)
  ) {
    createNotification({
      userId: order.merchantId,
      kind: "commission_due",
      title: "Pay merchant platform commission",
      body: `Order ${short}… is delivered. Pay and record your platform commission before the deadline to avoid suspension.`,
      href: hrefM,
    });
    queueInAppNotificationEmail(
      order.merchantId,
      "Pay merchant platform commission",
      `Order ${short}… is delivered. Pay and record your platform commission before the deadline to avoid suspension.`,
      hrefM,
    );
  }

  if ((order.supplierCommissionAmount ?? 0) <= 0) return;
  if (isSupplierPlatformCommissionPaid(order)) return;

  const seen = new Set<string>();
  for (const line of order.items) {
    const co = getCompany(line.companyId);
    if (!co || seen.has(co.ownerId)) continue;
    seen.add(co.ownerId);
    createNotification({
      userId: co.ownerId,
      kind: "commission_due",
      title: "Pay supplier platform commission",
      body: `Order ${short}… is delivered. Pay and record your platform commission before the deadline to avoid suspension.`,
      href: hrefS,
    });
    queueInAppNotificationEmail(
      co.ownerId,
      "Pay supplier platform commission",
      `Order ${short}… is delivered. Pay and record your platform commission before the deadline to avoid suspension.`,
      hrefS,
    );
  }
}

export function notifyAdminsBankProofSubmitted(order: Order): void {
  notifyAdmins({
    title: "Bank transfer proof submitted",
    body: `Merchant submitted a payment screenshot for order ${order.id.slice(0, 8)}… (${order.totalPrice.toLocaleString()} ETB). Review and approve.`,
    href: `/admin/orders/${order.id}`,
  });
}

/** After buyer → platform commission is recorded (before merchant completes). */
export function notifyMerchantSupplierPayoutReleased(order: Order): void {
  const short = order.id.slice(0, 8);
  const supplierFee = (order.supplierCommissionAmount ?? 0) > 0;
  const supplierDone = Boolean(order.supplierCommissionPaidAt);
  const body =
    supplierFee && !supplierDone
      ? `Order ${short}… — your buyer platform fee is recorded. The supplier must still pay and record their platform fee before you can complete.`
      : `Order ${short}… — buyer platform commission recorded. Complete when the supplier has confirmed they received payment for the goods (if not already).`;
  createNotification({
    userId: order.merchantId,
    kind: "order_status",
    title: "Buyer commission recorded",
    body,
    href: `/merchant/orders/${order.id}`,
  });
  queueInAppNotificationEmail(
    order.merchantId,
    "Buyer commission recorded",
    body,
    `/merchant/orders/${order.id}`,
  );
}

/** When supplier records their platform fee — merchant can proceed if other gates are met. */
export function notifyMerchantSupplierCommissionRecorded(order: Order): void {
  const short = order.id.slice(0, 8);
  createNotification({
    userId: order.merchantId,
    kind: "order_status",
    title: "Supplier commission recorded",
    body: `Order ${short}… — the supplier recorded their platform fee. You can complete once they confirm they received payment for the goods.`,
    href: `/merchant/orders/${order.id}`,
  });
  queueInAppNotificationEmail(
    order.merchantId,
    "Supplier commission recorded",
    `Order ${short}… — the supplier recorded their platform fee. You can complete once they confirm they received payment for the goods.`,
    `/merchant/orders/${order.id}`,
  );
}

/** Suppliers get confirmation when buyer commission is logged. */
export function notifySuppliersPayoutRecorded(order: Order): void {
  const amt = order.commissionAmount;
  const seen = new Set<string>();
  for (const item of order.items) {
    const co = getCompany(item.companyId);
    if (!co || seen.has(co.ownerId)) continue;
    seen.add(co.ownerId);
    createNotification({
      userId: co.ownerId,
      kind: "order_status",
      title: "Buyer commission logged",
      body: `Order ${order.id.slice(0, 8)}… — buyer platform commission recorded: ${amt.toLocaleString()} ETB.`,
      href: `/supplier/orders/${order.id}`,
    });
    queueInAppNotificationEmail(
      co.ownerId,
      "Buyer commission logged",
      `Order ${order.id.slice(0, 8)}… — buyer platform commission recorded: ${amt.toLocaleString()} ETB.`,
      `/supplier/orders/${order.id}`,
    );
  }
}

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
      body: `Order status is now: ${line}.`,
      href: `/supplier/orders/${order.id}`,
    });
    queueInAppNotificationEmail(
      co.ownerId,
      "Order update",
      `Order status is now: ${line}.`,
      `/supplier/orders/${order.id}`,
    );
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
    if (isSendGridMirrorChatEnabled()) {
      queueInAppNotificationEmail(
        order.merchantId,
        "New order message",
        snippet,
        `/merchant/orders/${order.id}`,
      );
    }
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
    if (isSendGridMirrorChatEnabled()) {
      queueInAppNotificationEmail(
        co.ownerId,
        "New order message",
        snippet,
        `/supplier/orders/${order.id}`,
      );
    }
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
  queueInAppNotificationEmail(
    co.ownerId,
    `New ${rating}★ company review`,
    body,
    `/supplier/companies`,
  );
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
  queueInAppNotificationEmail(
    co.ownerId,
    `New ${rating}★ product review`,
    body,
    `/products/${productId}`,
  );
}

/* ──────────────── Verification Notifications ──────────────── */

export function notifyUserVerificationResult(
  userId: string,
  approved: boolean,
  reason?: string,
): void {
  const title = approved
    ? "Identity verified ✓"
    : "Identity verification declined";
  const body = approved
    ? "Your National ID has been verified. You now have full access to the platform."
    : `Your National ID verification was declined. Reason: ${reason ?? "Not specified"}. You may re-submit with corrected information.`;
  const href = `/merchant/verification`;
  const user = findUserById(userId);
  const actualHref = user?.role === "supplier" ? "/supplier/verification" : href;
  createNotification({
    userId,
    kind: "verification_status",
    title,
    body,
    href: actualHref,
  });
  queueInAppNotificationEmail(userId, title, body, actualHref);
}

export function notifySupplierCompanyVerificationResult(
  companyId: string,
  approved: boolean,
  reason?: string,
): void {
  const co = getCompany(companyId);
  if (!co) return;
  const title = approved
    ? `Company "${co.name}" verified ✓`
    : `Company "${co.name}" verification declined`;
  const body = approved
    ? `Your company "${co.name}" has been approved. You can now list products under it.`
    : `Your company "${co.name}" was declined. Reason: ${reason ?? "Not specified"}. Please update your details and re-submit.`;
  createNotification({
    userId: co.ownerId,
    kind: "verification_status",
    title,
    body,
    href: "/supplier/companies",
  });
  queueInAppNotificationEmail(co.ownerId, title, body, "/supplier/companies");
}

export function notifyAdminsNewVerificationRequest(
  userId: string,
  type: "national_id" | "company",
  label?: string,
): void {
  const user = findUserById(userId);
  const name = user?.name ?? "A user";
  const roleLabel = user?.role === "supplier" ? "Supplier" : "Merchant";
  const title =
    type === "national_id"
      ? `New ID verification request`
      : `New company verification request`;
  const body =
    type === "national_id"
      ? `${roleLabel} "${name}" submitted their National ID for verification.`
      : `${roleLabel} "${name}" registered company "${label ?? "Unknown"}" for verification.`;
  const href = "/admin/verifications";
  notifyAdmins({ title, body, href });
}
