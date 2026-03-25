import { NextResponse } from "next/server";
import { companiesByOwner } from "@/lib/db/catalog";
import {
  getOrder,
  patchOrder,
  updateOrderStatus,
} from "@/lib/db/commerce";
import {
  notifyAdminsOrderDelivered,
  notifyCommissionDueOnDelivery,
  notifyMerchantOrderStatus,
  notifySuppliersOrderStatus,
} from "@/lib/db/notifications";
import { listPaymentsForOrder } from "@/lib/db/payments";
import { isValidSupplierStatusTransition } from "@/lib/domain/order-flow";
import { isSingleSupplierOrder } from "@/lib/domain/order-split";
import {
  isDualPlatformCommissionSettled,
  isMerchantPlatformCommissionPaid,
  isSupplierPlatformCommissionPaid,
} from "@/lib/domain/platform-commission";
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
    if (
      order.status === "awaiting_payment" ||
      order.status === "awaiting_bank_review"
    ) {
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
    if (!isDualPlatformCommissionSettled(order)) {
      return NextResponse.json(
        {
          error:
            !isMerchantPlatformCommissionPaid(order)
              ? "Pay your merchant platform commission for this order (or ask admin to record it) before completing."
              : "The supplier must pay and record their supplier platform commission before you can complete this order.",
        },
        { status: 400 },
      );
    }
    if (order.paymentStatus !== "paid") {
      return NextResponse.json(
        {
          error:
            "The supplier must confirm they received payment for this order before you can complete it.",
        },
        { status: 400 },
      );
    }
    const updated = patchOrder(id, {
      status: "completed",
    });
    if (updated) {
      notifySuppliersOrderStatus(updated, "completed");
    }
    return NextResponse.json({ order: updated });
  }

  if (
    order.status === "awaiting_payment" ||
    order.status === "awaiting_bank_review"
  ) {
    return NextResponse.json(
      { error: "Payment must be confirmed before fulfillment updates" },
      { status: 400 },
    );
  }

  const mine = new Set(companiesByOwner(auth.user.id).map((c) => c.id));
  if (!isSingleSupplierOrder(order)) {
    return NextResponse.json(
      {
        error:
          "This order mixes multiple suppliers. Status updates apply to one supplier per order; contact support for legacy orders.",
      },
      { status: 400 },
    );
  }
  const supplierCompanyId = order.items[0].companyId;
  if (!mine.has(supplierCompanyId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!status) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  if (order.status === "completed" || order.status === "rejected") {
    return NextResponse.json({ error: "Order is closed" }, { status: 400 });
  }
  if (order.status === "delivered") {
    const buyerDone = isMerchantPlatformCommissionPaid(order);
    const supplierDone = isSupplierPlatformCommissionPaid(order);
    return NextResponse.json(
      {
        error:
          buyerDone && supplierDone
            ? "Order is delivered — waiting for the buyer to complete"
            : !buyerDone
              ? "Order is delivered — the buyer must pay their merchant platform commission before they can complete"
              : "Order is delivered — you must pay and record your supplier platform commission before the buyer can complete",
      },
      { status: 400 },
    );
  }
  if (!isValidSupplierStatusTransition(order, status)) {
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
    if (status === "delivered") {
      notifyAdminsOrderDelivered(updated);
      notifyCommissionDueOnDelivery(updated);
    }
  }
  return NextResponse.json({ order: updated });
}
