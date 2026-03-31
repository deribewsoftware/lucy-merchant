import { randomUUID } from "crypto";
import {
  companiesByOwner,
  getSystemConfig,
  updateProductStock,
} from "@/lib/db/catalog";
import type { Cart, CartItem, Order, OrderStatus } from "@/lib/domain/types";
import { readJsonFile, writeJsonFile } from "@/lib/store/json-file";

const CARTS = "carts.json";
const ORDERS = "orders.json";

type CartMap = Record<string, Cart>;

function loadCarts(): CartMap {
  return readJsonFile<CartMap>(CARTS, {});
}

function saveCarts(m: CartMap) {
  writeJsonFile(CARTS, m);
}

/** Remove a SKU from every merchant cart (e.g. after supplier deletes listing). */
export function removeProductFromAllCarts(productId: string): void {
  const m = loadCarts();
  let changed = false;
  for (const merchantId of Object.keys(m)) {
    const cart = m[merchantId];
    const nextItems = cart.items.filter((i) => i.productId !== productId);
    if (nextItems.length !== cart.items.length) {
      m[merchantId] = recalc({ ...cart, items: nextItems });
      changed = true;
    }
  }
  if (changed) saveCarts(m);
}

function loadOrders(): Order[] {
  return readJsonFile<Order[]>(ORDERS, []);
}

function saveOrders(o: Order[]) {
  writeJsonFile(ORDERS, o);
}

export function getCart(merchantId: string): Cart {
  const m = loadCarts();
  const existing = m[merchantId];
  if (existing) return existing;
  const cart: Cart = {
    id: randomUUID(),
    merchantId,
    items: [],
    totalAmount: 0,
    updatedAt: new Date().toISOString(),
  };
  m[merchantId] = cart;
  saveCarts(m);
  return cart;
}

function recalc(cart: Cart): Cart {
  const totalAmount = cart.items.reduce((s, i) => s + i.subtotal, 0);
  return {
    ...cart,
    totalAmount,
    updatedAt: new Date().toISOString(),
  };
}

export function setCartItem(
  merchantId: string,
  item: CartItem,
): Cart {
  const m = loadCarts();
  let cart = m[merchantId] ?? getCart(merchantId);
  const idx = cart.items.findIndex((i) => i.productId === item.productId);
  if (item.quantity <= 0) {
    cart.items = cart.items.filter((i) => i.productId !== item.productId);
  } else if (idx === -1) {
    cart.items = [...cart.items, item];
  } else {
    const next = [...cart.items];
    next[idx] = item;
    cart.items = next;
  }
  cart = recalc(cart);
  m[merchantId] = cart;
  saveCarts(m);
  return cart;
}

export function clearCart(merchantId: string): void {
  const m = loadCarts();
  m[merchantId] = {
    id: randomUUID(),
    merchantId,
    items: [],
    totalAmount: 0,
    updatedAt: new Date().toISOString(),
  };
  saveCarts(m);
}

export function listOrders(): Order[] {
  return loadOrders();
}

export function createOrder(o: Order): Order {
  const all = loadOrders();
  all.push(o);
  saveOrders(all);
  return o;
}

export function getOrder(id: string): Order | undefined {
  return loadOrders().find((x) => x.id === id);
}

export function ordersForMerchant(merchantId: string): Order[] {
  return loadOrders()
    .filter((o) => o.merchantId === merchantId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function ordersForSupplierCompanyIds(companyIds: string[]): Order[] {
  const set = new Set(companyIds);
  return loadOrders()
    .filter((o) => o.items.some((i) => set.has(i.companyId)))
    .filter(
      (o) =>
        o.status !== "awaiting_payment" && o.status !== "awaiting_bank_review",
    )
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  extra?: Partial<Order>,
): Order | undefined {
  const all = loadOrders();
  const i = all.findIndex((o) => o.id === orderId);
  if (i === -1) return undefined;
  const cur = all[i];
  const patch: Partial<Order> = { ...extra, status };
  if (status === "delivered" && !cur.commissionDeadlineAt) {
    const hours = getSystemConfig().commissionPaymentGraceHours ?? 72;
    patch.commissionDeadlineAt = new Date(
      Date.now() + hours * 3600 * 1000,
    ).toISOString();
  }
  if (status === "accepted" && !cur.fulfillmentAcceptedAt) {
    patch.fulfillmentAcceptedAt = new Date().toISOString();
  }
  all[i] = { ...cur, ...patch } as Order;
  saveOrders(all);
  return all[i];
}

/** Rejections in the last `days` for orders owned by this supplier (single-supplier orders). */
export function supplierRejectionsInLastDays(
  supplierUserId: string,
  days: number,
): number {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const companyIds = new Set(
    companiesByOwner(supplierUserId).map((c) => c.id),
  );
  return loadOrders().filter((o) => {
    if (o.status !== "rejected") return false;
    if (!o.supplierRejectedAt) return false;
    if (new Date(o.supplierRejectedAt).getTime() < cutoff) return false;
    if (o.items.length === 0) return false;
    if (o.items.length > 1) {
      const first = o.items[0].companyId;
      if (!o.items.every((i) => i.companyId === first)) return false;
    }
    return companyIds.has(o.items[0].companyId);
  }).length;
}

export function patchOrder(
  orderId: string,
  patch: Partial<Order>,
): Order | undefined {
  const all = loadOrders();
  const i = all.findIndex((o) => o.id === orderId);
  if (i === -1) return undefined;
  all[i] = { ...all[i], ...patch } as Order;
  saveOrders(all);
  return all[i];
}

/** Removes an order and restores product stock (used when online checkout fails after orders were created). */
export function removeOrderAndRestoreStock(orderId: string): boolean {
  const order = getOrder(orderId);
  if (!order) return false;
  for (const line of order.items) {
    updateProductStock(line.productId, line.quantity);
  }
  const all = loadOrders();
  const next = all.filter((o) => o.id !== orderId);
  saveOrders(next);
  return true;
}

export function updateOrderPaymentStatus(
  orderId: string,
  paymentStatus: Order["paymentStatus"],
): Order | undefined {
  const all = loadOrders();
  const i = all.findIndex((o) => o.id === orderId);
  if (i === -1) return undefined;
  all[i] = { ...all[i], paymentStatus };
  saveOrders(all);
  return all[i];
}
