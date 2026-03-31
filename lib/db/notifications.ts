import { randomUUID } from "crypto";
import type {
  CompanyReview,
  NotificationRecord,
  Order,
  ProductComment,
  ProductReview,
} from "@/lib/domain/types";
import { getCompany, getProduct } from "@/lib/db/catalog";
import { isStaffAdminRole } from "@/lib/admin-staff";
import { findUserById, listUsers } from "@/lib/db/users";
import { queueInAppNotificationEmail } from "@/lib/email/mirror-in-app-notification";
import type { EmailMirrorCategory } from "@/lib/user/email-preferences";
import {
  adminCopyBankReceiptPendingFirstUpload,
  adminCopyOrderCompletedByBuyer,
  adminCopyOrderCompletedByPlatform,
  copyCommissionProofsAcknowledged,
  merchantCopyBankProofSavedPending,
  merchantCopyBankProofSubmittedForReview,
  merchantCopyBankProofUpdated,
  merchantCopyForSupplierStatusChange,
  merchantCopyPaymentVerified,
  merchantCopySupplierConfirmedPayment,
  supplierCopyBuyerBankReceiptFirstUpload,
  supplierCopyForOrderCompleted,
} from "@/lib/domain/order-notification-copy";
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

/** All notifications for a user (newest first), for server-side pagination. */
export function allNotificationsForUser(userId: string): NotificationRecord[] {
  return load()
    .filter((r) => r.userId === userId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
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
  emailCategory?: EmailMirrorCategory;
}): void {
  const cat = input.emailCategory ?? "orders";
  for (const u of listUsers()) {
    if (!isStaffAdminRole(u.role)) continue;
    createNotification({
      userId: u.id,
      kind: "order_admin",
      title: input.title,
      body: input.body,
      href: input.href,
    });
    queueInAppNotificationEmail(u.id, input.title, input.body, input.href, {
      emailCategory: cat,
    });
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

/**
 * Merchant is notified when the supplier changes fulfillment status (or when an admin marks completed).
 */
export function notifyMerchantOrderStatus(
  order: Order,
  status: Order["status"],
  options?: { completedBy?: "admin" },
): void {
  const { title, body } = merchantCopyForSupplierStatusChange(
    order,
    status,
    options,
  );
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

/** After bank/gateway payment is verified and the order becomes `pending` for suppliers. */
export function notifyMerchantPaymentVerified(order: Order): void {
  const { title, body } = merchantCopyPaymentVerified(order);
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

/** Supplier marked buyer payment as received (COD / bank). */
export function notifyMerchantSupplierConfirmedPaymentReceived(order: Order): void {
  const { title, body } = merchantCopySupplierConfirmedPayment(order);
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

/** All admins: buyer marked the order completed (audit / visibility). */
export function notifyAdminsOrderCompletedByBuyer(order: Order): void {
  const { title, body } = adminCopyOrderCompletedByBuyer(order);
  notifyAdmins({
    title,
    body,
    href: `/admin/orders/${order.id}`,
  });
}

/** Other admins (not the actor): audit when an administrator closes the order. */
export function notifyAdminsOrderCompletedByAdmin(
  order: Order,
  actingAdminUserId?: string,
): void {
  const admin = actingAdminUserId ? findUserById(actingAdminUserId) : undefined;
  const { title, body } = adminCopyOrderCompletedByPlatform(order, admin?.name);
  const href = `/admin/orders/${order.id}`;
  for (const u of listUsers()) {
    if (!isStaffAdminRole(u.role)) continue;
    if (actingAdminUserId && u.id === actingAdminUserId) continue;
    createNotification({
      userId: u.id,
      kind: "order_admin",
      title,
      body,
      href,
    });
    queueInAppNotificationEmail(u.id, title, body, href);
  }
}

/** Merchant + involved suppliers: admin acknowledged commission proof uploads. */
export function notifyCommissionProofsAcknowledged(order: Order): void {
  const { title, body } = copyCommissionProofsAcknowledged(order);
  const hrefM = `/merchant/orders/${order.id}`;
  createNotification({
    userId: order.merchantId,
    kind: "order_status",
    title,
    body,
    href: hrefM,
  });
  queueInAppNotificationEmail(
    order.merchantId,
    title,
    body,
    hrefM,
  );
  const seen = new Set<string>();
  for (const line of order.items) {
    const co = getCompany(line.companyId);
    if (!co || seen.has(co.ownerId)) continue;
    seen.add(co.ownerId);
    const hrefS = `/supplier/orders/${order.id}`;
    createNotification({
      userId: co.ownerId,
      kind: "order_status",
      title,
      body,
      href: hrefS,
    });
    queueInAppNotificationEmail(co.ownerId, title, body, hrefS);
  }
}

/** When merchant completes (or other merchant-side events), ping involved suppliers */
export function notifyAdminsOrderDelivered(order: Order): void {
  notifyAdmins({
    title: "Order delivered",
    body: `Order ${order.id.slice(0, 8)}… marked delivered — ${order.totalPrice.toLocaleString()} ETB.`,
    href: `/admin/orders/${order.id}`,
  });
}

/** Buyer opened a late-delivery dispute — admins + involved suppliers. */
export function notifyStakeholdersMerchantDispute(order: Order): void {
  const short = order.id.slice(0, 8);
  const snippet = (order.merchantDisputeReason ?? "").trim().slice(0, 400);
  const title = "Delivery dispute opened";
  const body = `Order ${short}… (${order.totalPrice.toLocaleString()} ETB). ${snippet}`;
  notifyAdmins({
    title,
    body,
    href: `/admin/orders/${order.id}`,
  });
  const seen = new Set<string>();
  for (const line of order.items) {
    const co = getCompany(line.companyId);
    if (!co || seen.has(co.ownerId)) continue;
    seen.add(co.ownerId);
    const hrefS = `/supplier/orders/${order.id}`;
    createNotification({
      userId: co.ownerId,
      kind: "order_status",
      title: "Buyer opened a delivery dispute",
      body: `Order ${short}… — ${snippet || "See order details."}`,
      href: hrefS,
    });
    queueInAppNotificationEmail(
      co.ownerId,
      "Buyer opened a delivery dispute",
      `Order ${short}… — ${snippet || "See order details."}`,
      hrefS,
    );
  }
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

/** Merchant confirmation after uploading a bank receipt (in-app + email). */
/** Involved suppliers: buyer attached the first bank receipt on a pending bank-transfer order. */
export function notifySuppliersBuyerBankReceiptUploaded(order: Order): void {
  const merchant = findUserById(order.merchantId);
  const name = merchant?.name ?? "The buyer";
  const { title, body } = supplierCopyBuyerBankReceiptFirstUpload(order, name);
  const seen = new Set<string>();
  for (const line of order.items) {
    const co = getCompany(line.companyId);
    if (!co || seen.has(co.ownerId)) continue;
    seen.add(co.ownerId);
    createNotification({
      userId: co.ownerId,
      kind: "order_status",
      title,
      body,
      href: `/supplier/orders/${order.id}`,
    });
    queueInAppNotificationEmail(
      co.ownerId,
      title,
      body,
      `/supplier/orders/${order.id}`,
    );
  }
}

/** Admins: first bank receipt on a pending order (parallel to legacy “awaiting review” admin ping). */
export function notifyAdminsBankReceiptOnPendingOrder(order: Order): void {
  const { title, body } = adminCopyBankReceiptPendingFirstUpload(order);
  notifyAdmins({
    title,
    body,
    href: `/admin/orders/${order.id}`,
  });
}

export function notifyMerchantBankProofUploaded(
  order: Order,
  variant:
    | "submitted_for_review"
    | "receipt_saved_pending"
    | "receipt_updated",
): void {
  const { title, body } =
    variant === "submitted_for_review"
      ? merchantCopyBankProofSubmittedForReview(order)
      : variant === "receipt_saved_pending"
        ? merchantCopyBankProofSavedPending(order)
        : merchantCopyBankProofUpdated(order);
  const href = `/merchant/orders/${order.id}`;
  createNotification({
    userId: order.merchantId,
    kind: "order_status",
    title,
    body,
    href,
  });
  queueInAppNotificationEmail(order.merchantId, title, body, href);
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

/**
 * Notifies suppliers when the order reaches `completed` (buyer or admin).
 */
export function notifySuppliersOrderStatus(
  order: Order,
  status: Order["status"],
  options?: { completedBy?: "merchant" | "admin" },
): void {
  if (status !== "completed") return;
  const completedBy = options?.completedBy ?? "merchant";
  const { title, body } = supplierCopyForOrderCompleted(order, { completedBy });
  const seen = new Set<string>();
  for (const item of order.items) {
    const co = getCompany(item.companyId);
    if (!co || seen.has(co.ownerId)) continue;
    seen.add(co.ownerId);
    createNotification({
      userId: co.ownerId,
      kind: "order_status",
      title,
      body,
      href: `/supplier/orders/${order.id}`,
    });
    queueInAppNotificationEmail(
      co.ownerId,
      title,
      body,
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
    queueInAppNotificationEmail(
      order.merchantId,
      "New order message",
      snippet,
      `/merchant/orders/${order.id}`,
      { emailCategory: "chat" },
    );
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
    queueInAppNotificationEmail(
      co.ownerId,
      "New order message",
      snippet,
      `/supplier/orders/${order.id}`,
      { emailCategory: "chat" },
    );
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
    { emailCategory: "reviews" },
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
    { emailCategory: "reviews" },
  );
}

/** Supplier: someone commented on a product they own (not when the supplier comments on their own listing). */
export function notifySupplierProductCommentPosted(input: {
  productId: string;
  authorUserId: string;
  preview: string;
}): void {
  const p = getProduct(input.productId);
  if (!p) return;
  const co = getCompany(p.companyId);
  if (!co) return;
  if (co.ownerId === input.authorUserId) return;
  const body =
    input.preview.length > 120
      ? `${input.preview.slice(0, 117)}…`
      : input.preview;
  const label =
    p.name.length > 48 ? `${p.name.slice(0, 45)}…` : p.name;
  const title = `New comment — ${label}`;
  createNotification({
    userId: co.ownerId,
    kind: "review_product",
    title,
    body,
    href: `/supplier/products/${input.productId}/edit`,
  });
  queueInAppNotificationEmail(
    co.ownerId,
    title,
    body,
    `/supplier/products/${input.productId}/edit`,
    { emailCategory: "reviews" },
  );
}

/** Parent comment author: someone replied in the thread (product page). */
export function notifyUserProductCommentReplied(input: {
  productId: string;
  parentAuthorUserId: string;
  replierUserId: string;
  preview: string;
}): void {
  if (input.parentAuthorUserId === input.replierUserId) return;
  const p = getProduct(input.productId);
  if (!p) return;
  const body =
    input.preview.length > 120
      ? `${input.preview.slice(0, 117)}…`
      : input.preview;
  const label =
    p.name.length > 40 ? `${p.name.slice(0, 37)}…` : p.name;
  const title = `Reply on ${label}`;
  const href = `/products/${input.productId}`;
  createNotification({
    userId: input.parentAuthorUserId,
    kind: "review_product",
    title,
    body,
    href,
  });
  queueInAppNotificationEmail(
    input.parentAuthorUserId,
    title,
    body,
    href,
    { emailCategory: "reviews" },
  );
}

/** Admin moderation: product review deleted. */
export function notifyMerchantProductReviewRemovedByModeration(
  review: ProductReview,
): void {
  const title = "Product review removed";
  const body = `Your ${review.rating}★ product review was removed by a moderator.`;
  const href = `/products/${review.productId}`;
  createNotification({
    userId: review.merchantId,
    kind: "review_product",
    title,
    body,
    href,
  });
  queueInAppNotificationEmail(review.merchantId, title, body, href, {
    emailCategory: "reviews",
  });
}

/** Admin moderation: company review deleted. */
export function notifyMerchantCompanyReviewRemovedByModeration(
  review: CompanyReview,
): void {
  const title = "Company review removed";
  const body = `Your ${review.rating}★ company review was removed by a moderator.`;
  const href = `/companies/${review.companyId}`;
  createNotification({
    userId: review.merchantId,
    kind: "review_company",
    title,
    body,
    href,
  });
  queueInAppNotificationEmail(review.merchantId, title, body, href, {
    emailCategory: "reviews",
  });
}

/** Admin moderation: product comment (or thread root) deleted. */
export function notifyUserProductCommentRemovedByModeration(
  comment: ProductComment,
): void {
  const title = "Comment removed";
  const body =
    "A comment you posted on a product was removed by a moderator. Related replies may have been removed as well.";
  const href = `/products/${comment.productId}`;
  createNotification({
    userId: comment.userId,
    kind: "review_product",
    title,
    body,
    href,
  });
  queueInAppNotificationEmail(comment.userId, title, body, href, {
    emailCategory: "reviews",
  });
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
    ? "Your Fayda (Ethiopian Digital ID) verification is complete. You now have full access where identity checks apply."
    : `Your Fayda verification was declined. Reason: ${reason ?? "Not specified"}. You may re-submit with corrected information.`;
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
  queueInAppNotificationEmail(userId, title, body, actualHref, {
    emailCategory: "account",
  });
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
  queueInAppNotificationEmail(co.ownerId, title, body, "/supplier/companies", {
    emailCategory: "account",
  });
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
      ? `New Fayda verification request`
      : `New company verification request`;
  const body =
    type === "national_id"
      ? `${roleLabel} "${name}" submitted their Ethiopian Digital ID (Fayda) for verification.`
      : `${roleLabel} "${name}" registered company "${label ?? "Unknown"}" for verification.`;
  const href = "/admin/verifications";
  notifyAdmins({ title, body, href, emailCategory: "account" });
}
