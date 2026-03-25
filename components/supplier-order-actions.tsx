"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  defaultSupplierNextChoice,
  supplierAllowedNextStatuses,
} from "@/lib/domain/order-flow";
import {
  isSupplierPositiveTransition,
  orderStatusLabel,
  supplierActionButtonLabel,
} from "@/lib/domain/order-presentations";
import type { Order, OrderStatus } from "@/lib/domain/types";

type OrderSlice = Pick<
  Order,
  "status" | "paymentMethod" | "paymentStatus"
>;

type Props = {
  orderId: string;
  order: OrderSlice;
  /** Buyer → platform commission recorded (merchant-paid or legacy). */
  platformCommissionPaid: boolean;
  /** Supplier → platform commission recorded when a fee applies. */
  supplierCommissionPaid: boolean;
  /** ETB owed by supplier to platform on this order (0 = none). */
  supplierCommissionOwed: number;
};

export function SupplierOrderActions({
  orderId,
  order,
  platformCommissionPaid,
  supplierCommissionPaid,
  supplierCommissionOwed,
}: Props) {
  const router = useRouter();
  const current = order.status;
  const allowed = supplierAllowedNextStatuses(order);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (current === "completed" || current === "rejected") {
    return (
      <div className="rounded-xl border border-base-300 bg-base-200/30 px-3 py-2 text-xs text-base-content/60">
        Closed —{" "}
        <span className="font-medium capitalize text-base-content">
          {orderStatusLabel(current)}
        </span>
      </div>
    );
  }

  if (current === "delivered") {
    const needSupplierFee =
      supplierCommissionOwed > 0 && !supplierCommissionPaid;
    return (
      <div className="max-w-md rounded-xl border border-info/30 bg-info/5 px-3 py-2 text-xs text-base-content/70">
        <span className="font-semibold text-info">Delivered</span>
        {" — "}
        {!platformCommissionPaid
          ? "The buyer pays their platform commission after delivery and records it first."
          : needSupplierFee
            ? "Pay and record your supplier platform commission on this order — then the buyer can complete after you confirm you received payment for the goods."
            : "Platform fees are recorded — the buyer can complete once they confirm everything."}
      </div>
    );
  }

  if (allowed.length === 0) {
    return (
      <div className="rounded-xl border border-base-300 bg-base-200/30 px-3 py-2 text-xs text-base-content/60">
        {current === "pending" &&
        order.paymentMethod === "bank_transfer" &&
        order.paymentStatus !== "paid" ? (
          <>
            Waiting for the buyer to transfer and upload proof, then confirm payment received
            above.
          </>
        ) : (
          <>
            Status:{" "}
            <span className="font-medium capitalize text-base-content">
              {orderStatusLabel(current)}
            </span>
            <span className="text-base-content/50"> — no updates available.</span>
          </>
        )}
      </div>
    );
  }

  async function save(next: OrderStatus) {
    setLoading(true);
    setMsg(null);
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMsg(data.error ?? "Update failed");
      return;
    }
    router.refresh();
  }

  const positive = allowed.filter((s) => isSupplierPositiveTransition(s));
  const primary =
    positive.find((s) => s === defaultSupplierNextChoice(order)) ??
    positive[0];

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {primary ? (
          <button
            type="button"
            disabled={loading}
            onClick={() => save(primary)}
            className="btn btn-primary btn-sm"
          >
            {loading ? (
              <span className="loading loading-spinner loading-xs" />
            ) : null}
            {supplierActionButtonLabel(primary)}
          </button>
        ) : null}
        {allowed.includes("rejected") && primary !== "rejected" ? (
          <button
            type="button"
            disabled={loading}
            onClick={() => save("rejected")}
            className="btn btn-outline btn-error btn-sm border-error/40"
          >
            Reject order
          </button>
        ) : null}
      </div>

      {msg ? (
        <p className="text-xs text-error" role="alert">
          {msg}
        </p>
      ) : null}
    </div>
  );
}
