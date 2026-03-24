import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import {
  getProduct,
  getSystemConfig,
  incrementProductOrders,
  updateProductStock,
} from "@/lib/db/catalog";
import {
  clearCart,
  createOrder,
  getCart,
} from "@/lib/db/commerce";
import { notifySuppliersNewOrder } from "@/lib/db/notifications";
import { createPayment } from "@/lib/db/payments";
import type { Order } from "@/lib/domain/types";
import { requireSession } from "@/lib/server/require-session";
import { checkRateLimit, clientIp } from "@/lib/server/rate-limit";

export async function POST(request: Request) {
  const auth = await requireSession(["merchant"]);
  if (!auth.ok) return auth.response;

  const ip = clientIp(request);
  const rl = checkRateLimit(
    `checkout:${auth.user.id}:${ip}`,
    12,
    15 * 60 * 1000,
  );
  if (!rl.ok) {
    return NextResponse.json(
      {
        error: `Too many checkout attempts. Retry in ${rl.retryAfterSec}s`,
      },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const deliveryLocation = String(body?.deliveryLocation ?? "").trim();
  const paymentMethod =
    body?.paymentMethod === "bank_transfer" ? "bank_transfer" : "cod";
  if (!deliveryLocation) {
    return NextResponse.json(
      { error: "Delivery location is required" },
      { status: 400 },
    );
  }

  const cart = getCart(auth.user.id);
  if (cart.items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const cfg = getSystemConfig();
  let total = 0;
  const resolvedItems = [];

  for (const line of cart.items) {
    const product = getProduct(line.productId);
    if (!product) {
      return NextResponse.json(
        { error: `Product ${line.productId} no longer exists` },
        { status: 400 },
      );
    }
    if (line.quantity < product.minOrderQuantity) {
      return NextResponse.json(
        {
          error: `${product.name}: minimum quantity is ${product.minOrderQuantity}`,
        },
        { status: 400 },
      );
    }
    if (line.quantity > product.availableQuantity) {
      return NextResponse.json(
        { error: `${product.name}: insufficient stock` },
        { status: 400 },
      );
    }
    if (line.quantity > product.maxDeliveryQuantity) {
      return NextResponse.json(
        {
          error: `${product.name}: exceeds max delivery ${product.maxDeliveryQuantity}`,
        },
        { status: 400 },
      );
    }
    const subtotal = Math.round(product.price * line.quantity * 100) / 100;
    total += subtotal;
    resolvedItems.push({
      productId: product.id,
      companyId: product.companyId,
      quantity: line.quantity,
      price: product.price,
      subtotal,
    });
  }

  total = Math.round(total * 100) / 100;
  const commissionRaw = cfg.freeCommissionEnabled
    ? 0
    : (total * cfg.orderCommissionPercent) / 100;
  const commissionAmount = Math.round(commissionRaw * 100) / 100;

  const order: Order = {
    id: randomUUID(),
    merchantId: auth.user.id,
    items: resolvedItems,
    totalPrice: total,
    deliveryLocation,
    status: "pending",
    commissionAmount,
    paymentStatus: "pending",
    paymentMethod,
    createdAt: new Date().toISOString(),
  };

  createOrder(order);
  notifySuppliersNewOrder(order);
  const payment = createPayment({
    orderId: order.id,
    method: paymentMethod,
    amount: order.totalPrice,
  });
  for (const line of resolvedItems) {
    updateProductStock(line.productId, -line.quantity);
    incrementProductOrders(line.productId);
  }
  clearCart(auth.user.id);

  return NextResponse.json({ order, payment });
}
