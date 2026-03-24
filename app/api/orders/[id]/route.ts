import { NextResponse } from "next/server";
import { companiesByOwner } from "@/lib/db/catalog";
import {
  getOrder,
  updateOrderStatus,
} from "@/lib/db/commerce";
import {
  notifyMerchantOrderStatus,
  notifySuppliersOrderStatus,
} from "@/lib/db/notifications";
import { listPaymentsForOrder } from "@/lib/db/payments";
import {
  isValidSupplierStatusTransition,
} from "@/lib/domain/order-flow";
import type { OrderStatus } from "@/lib/domain/types";
import { requireSession } from "@/lib/server/require-session";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Params) {
  const auth = await requireSession(["merchant", "supplier", "admin"]);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const order = getOrder(id);
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (auth.user.role === "merchant" && order.merchantId !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (auth.user.role === "supplier") {
    const mine = new Set(companiesByOwner(auth.user.id).map((c) => c.id));
    const touches = order.items.some((i) => mine.has(i.companyId));
    if (!touches) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.json({
    order,
    payments: listPaymentsForOrder(order.id),
  });
}

export async function PATCH(request: Request, context: Params) {
  const auth = await requireSession(["supplier", "merchant"]);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const order = getOrder(id);
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const status = body?.status as OrderStatus | undefined;

  if (auth.user.role === "merchant") {
    if (order.merchantId !== auth.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (status !== "completed") {
      return NextResponse.json(
        { error: "Merchants may only mark orders as completed" },
        { status: 400 },
      );
    }
    if (order.status !== "delivered") {
      return NextResponse.json(
        { error: "Order must be delivered before you can complete it" },
        { status: 400 },
      );
    }
    const updated = updateOrderStatus(id, "completed");
    if (updated) {
      notifySuppliersOrderStatus(updated, "completed");
    }
    return NextResponse.json({ order: updated });
  }

  const mine = new Set(companiesByOwner(auth.user.id).map((c) => c.id));
  const touches = order.items.some((i) => mine.has(i.companyId));
  if (!touches) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!status) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  if (order.status === "completed" || order.status === "rejected") {
    return NextResponse.json({ error: "Order is closed" }, { status: 400 });
  }
  if (order.status === "delivered") {
    return NextResponse.json(
      { error: "Order is delivered — waiting for merchant to complete" },
      { status: 400 },
    );
  }
  if (!isValidSupplierStatusTransition(order.status, status)) {
    return NextResponse.json(
      {
        error: `Cannot move from ${order.status.replace("_", " ")} to ${status.replace("_", " ")}`,
      },
      { status: 400 },
    );
  }

  const updated = updateOrderStatus(id, status);
  if (updated && auth.user.role === "supplier") {
    notifyMerchantOrderStatus(updated, updated.status);
  }
  return NextResponse.json({ order: updated });
}
