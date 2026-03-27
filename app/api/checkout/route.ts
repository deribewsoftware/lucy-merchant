import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import {
  getProduct,
  getSystemConfig,
  incrementProductOrders,
  updateProductStock,
} from "@/lib/db/catalog";
import { clearCart, createOrder, getCart } from "@/lib/db/commerce";
import {
  notifyMerchantOrderPlaced,
  notifySuppliersNewOrder,
} from "@/lib/db/notifications";
import { createPayment } from "@/lib/db/payments";
import { groupOrderLinesByCompany } from "@/lib/domain/order-split";
import { API_MERCHANT_COMMISSION_SUSPENDED } from "@/lib/domain/commission-hold-copy";
import { merchantHasOutstandingCommission } from "@/lib/server/merchant-commission";
import type { Order, Payment, PaymentMethod } from "@/lib/domain/types";
import { requireSession } from "@/lib/server/require-session";
import { checkRateLimit, clientIp } from "@/lib/server/rate-limit";

/** Direct pay to supplier: cash on delivery or bank transfer to supplier’s company account. */
const METHODS: PaymentMethod[] = ["cod", "bank_transfer"];

function parsePaymentMethod(raw: unknown): PaymentMethod | null {
  const s = String(raw ?? "");
  return METHODS.includes(s as PaymentMethod) ? (s as PaymentMethod) : null;
}

export async function POST(request: Request) {
  const auth = await requireSession(["merchant"]);
  if (!auth.ok) return auth.response;

  if (merchantHasOutstandingCommission(auth.user.id)) {
    return NextResponse.json({ error: API_MERCHANT_COMMISSION_SUSPENDED }, { status: 403 });
  }

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
  const paymentMethod = parsePaymentMethod(body?.paymentMethod);

  if (!paymentMethod) {
    return NextResponse.json(
      {
        error:
          "Choose cash on delivery or bank transfer to the supplier’s account",
      },
      { status: 400 },
    );
  }
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
  const resolvedItems: {
    productId: string;
    companyId: string;
    quantity: number;
    price: number;
    subtotal: number;
  }[] = [];

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
    resolvedItems.push({
      productId: product.id,
      companyId: product.companyId,
      quantity: line.quantity,
      price: product.price,
      subtotal,
    });
  }

  const byCompany = groupOrderLinesByCompany(resolvedItems);
  const orders: Order[] = [];
  const payments: Payment[] = [];

  for (const lines of byCompany.values()) {
    let total = 0;
    for (const line of lines) total += line.subtotal;
    total = Math.round(total * 100) / 100;
    const commissionRaw = cfg.freeCommissionEnabled
      ? 0
      : (total * cfg.orderCommissionPercent) / 100;
    const commissionAmount = Math.round(commissionRaw * 100) / 100;
    const supplierCommRaw = cfg.freeSupplierCommissionEnabled
      ? 0
      : (total * cfg.supplierOrderCommissionPercent) / 100;
    const supplierCommissionAmount = Math.round(supplierCommRaw * 100) / 100;

    const order: Order = {
      id: randomUUID(),
      merchantId: auth.user.id,
      items: lines,
      totalPrice: total,
      deliveryLocation,
      status: "pending",
      commissionAmount,
      supplierCommissionAmount,
      paymentStatus: "pending",
      paymentMethod,
      createdAt: new Date().toISOString(),
    };

    createOrder(order);
    notifySuppliersNewOrder(order);
    notifyMerchantOrderPlaced(order);
    const payment = createPayment({
      orderId: order.id,
      method: paymentMethod,
      amount: order.totalPrice,
    });
    for (const line of lines) {
      updateProductStock(line.productId, -line.quantity);
      incrementProductOrders(line.productId);
    }
    orders.push(order);
    payments.push(payment);
  }

  clearCart(auth.user.id);

  return NextResponse.json({
    orders,
    payments,
    order: orders[0],
    payment: payments[0],
  });
}
