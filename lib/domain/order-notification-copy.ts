import type { Order, OrderStatus } from "@/lib/domain/types";

function shortId(orderId: string): string {
  return `${orderId.slice(0, 8)}…`;
}

function etb(n: number): string {
  return n.toLocaleString();
}

/** Merchant-facing copy when the supplier changes fulfillment status. */
export function merchantCopyForSupplierStatusChange(
  order: Order,
  status: OrderStatus,
  options?: { completedBy?: "admin" },
): { title: string; body: string } {
  const s = shortId(order.id);
  const total = etb(order.totalPrice);
  switch (status) {
    case "accepted":
      return {
        title: "Supplier accepted your order",
        body: `Order ${s} (${total} ETB) was accepted. You will be notified when it moves to in progress and when it is delivered.`,
      };
    case "in_progress":
      return {
        title: "Order in progress",
        body: `Order ${s} (${total} ETB) is being prepared or fulfilled by the supplier.`,
      };
    case "delivered":
      return {
        title: "Order marked delivered",
        body: `Order ${s} (${total} ETB) was marked delivered. Complete any required platform fees, then mark the order complete when you are satisfied.`,
      };
    case "completed":
      if (options?.completedBy === "admin") {
        return {
          title: "Order closed by the platform",
          body: `Order ${s} (${total} ETB) was marked completed by an administrator.`,
        };
      }
      return {
        title: "Order completed",
        body: `Order ${s} (${total} ETB) is marked completed. Thank you for using the marketplace.`,
      };
    case "rejected": {
      const why = order.supplierRejectionReason?.trim();
      return {
        title: "Order declined by supplier",
        body: why
          ? `Order ${s} (${total} ETB) was declined.\n\nSupplier’s reason:\n${why}`
          : `Order ${s} (${total} ETB) was declined. Contact support if you need help or a refund.`,
      };
    }
    default:
      return {
        title: "Order update",
        body: `Order ${s} (${total} ETB) — status is now ${status.replace(/_/g, " ")}.`,
      };
  }
}

/** After admin/bank approval: payment is live and suppliers were notified. */
export function merchantCopyPaymentVerified(order: Order): {
  title: string;
  body: string;
} {
  const s = shortId(order.id);
  const total = etb(order.totalPrice);
  return {
    title: "Payment verified — order is active",
    body: `Your payment for order ${s} (${total} ETB) is confirmed. Suppliers have been notified and can accept or decline the order.`,
  };
}

/** Supplier confirmed they received buyer payment (COD / bank to supplier). */
export function merchantCopySupplierConfirmedPayment(order: Order): {
  title: string;
  body: string;
} {
  const s = shortId(order.id);
  const total = etb(order.totalPrice);
  return {
    title: "Supplier confirmed payment",
    body: `For order ${s} (${total} ETB), the supplier confirmed they received your payment. After delivery and platform fees, you can complete the order.`,
  };
}

/** Supplier-facing copy when the buyer or admin closes the order. */
export function supplierCopyForOrderCompleted(
  order: Order,
  options: { completedBy: "merchant" | "admin" },
): { title: string; body: string } {
  const s = shortId(order.id);
  const total = etb(order.totalPrice);
  if (options.completedBy === "admin") {
    return {
      title: "Order completed by platform",
      body: `Order ${s} (${total} ETB) was closed by an administrator. Thank you for fulfilling this sale.`,
    };
  }
  return {
    title: "Buyer completed the order",
    body: `The buyer marked order ${s} (${total} ETB) as completed. Thank you for fulfilling this sale.`,
  };
}

/** Admins: buyer closed the order. */
export function adminCopyOrderCompletedByBuyer(order: Order): {
  title: string;
  body: string;
} {
  const s = shortId(order.id);
  const total = etb(order.totalPrice);
  return {
    title: "Order completed by buyer",
    body: `Order ${s} (${total} ETB) was marked completed by the merchant (buyer).`,
  };
}

/** Admins: another admin closed the order. */
export function adminCopyOrderCompletedByPlatform(
  order: Order,
  adminName?: string,
): { title: string; body: string } {
  const s = shortId(order.id);
  const total = etb(order.totalPrice);
  const by = adminName ? ` (${adminName})` : "";
  return {
    title: "Order completed by admin",
    body: `Order ${s} (${total} ETB) was marked completed by an administrator${by}.`,
  };
}

/** Merchant + suppliers: admin acknowledged commission proof screenshots. */
export function copyCommissionProofsAcknowledged(order: Order): {
  title: string;
  body: string;
} {
  const s = shortId(order.id);
  return {
    title: "Commission proofs acknowledged",
    body: `An administrator acknowledged commission proof(s) for order ${s}. You can proceed per the order workflow.`,
  };
}

/** Merchant uploaded bank transfer screenshot (awaiting admin review). */
export function merchantCopyBankProofSubmittedForReview(order: Order): {
  title: string;
  body: string;
} {
  const s = shortId(order.id);
  const total = etb(order.totalPrice);
  return {
    title: "Bank receipt received",
    body: `We saved your payment screenshot for order ${s} (${total} ETB). An administrator will review it and confirm your payment.`,
  };
}

/** Merchant replaced bank transfer screenshot while order is still pending. */
export function merchantCopyBankProofUpdated(order: Order): {
  title: string;
  body: string;
} {
  const s = shortId(order.id);
  return {
    title: "Bank receipt updated",
    body: `Your payment screenshot for order ${s} was updated.`,
  };
}

/** First bank receipt on a pending bank-transfer order (before admin/supplier confirmation). */
export function merchantCopyBankProofSavedPending(order: Order): {
  title: string;
  body: string;
} {
  const s = shortId(order.id);
  const total = etb(order.totalPrice);
  return {
    title: "Payment screenshot saved",
    body: `Your bank transfer receipt for order ${s} (${total} ETB) was saved on the order.`,
  };
}

/** Supplier: first time buyer attaches bank receipt on a pending bank order. */
export function supplierCopyBuyerBankReceiptFirstUpload(
  order: Order,
  merchantName: string,
): { title: string; body: string } {
  const s = shortId(order.id);
  const total = etb(order.totalPrice);
  return {
    title: "Buyer uploaded bank receipt",
    body: `${merchantName} uploaded a bank transfer receipt for order ${s} (${total} ETB). Open the order when you verify payment.`,
  };
}

/** Admin: visibility when a pending bank order gets its first receipt (non-legacy flow). */
export function adminCopyBankReceiptPendingFirstUpload(order: Order): {
  title: string;
  body: string;
} {
  const s = shortId(order.id);
  const total = etb(order.totalPrice);
  return {
    title: "Bank receipt on pending order",
    body: `A merchant uploaded a bank transfer receipt for order ${s} (${total} ETB). The order is pending supplier fulfillment.`,
  };
}
