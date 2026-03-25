"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Banknote } from "lucide-react";
import type { Order } from "@/lib/domain/types";

type Props = {
  order: Pick<
    Order,
    "id" | "status" | "paymentMethod" | "paymentStatus"
  >;
};

/** Supplier confirms the buyer paid (bank transfer or COD). Platform commission is recorded by the buyer after delivery. */
export function SupplierPaymentActions({ order }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function confirmBuyerPaid() {
    setLoading(true);
    setMsg(null);
    const res = await fetch(
      `/api/orders/${order.id}/confirm-supplier-payment-received`,
      { method: "POST" },
    );
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMsg(data.error ?? "Could not confirm");
      return;
    }
    router.refresh();
  }

  const showConfirmPaid =
    order.paymentStatus === "pending" &&
    order.status === "pending" &&
    (order.paymentMethod === "bank_transfer" || order.paymentMethod === "cod");

  if (!showConfirmPaid) return null;

  return (
    <div className="space-y-3 rounded-2xl border border-secondary/30 bg-secondary/5 p-4 sm:p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-base-content/50">
        Supplier actions
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-base-content/80">
          {order.paymentMethod === "cod"
            ? "Confirm when you have agreed how cash will be collected (or on delivery)."
            : "Confirm when the buyer’s transfer to your company account has arrived."}
        </p>
        <button
          type="button"
          disabled={loading}
          onClick={confirmBuyerPaid}
          className="btn btn-secondary btn-sm shrink-0 gap-2"
        >
          {loading ? (
            <span className="loading loading-spinner loading-xs" />
          ) : (
            <Banknote className="h-4 w-4" />
          )}
          Confirm buyer payment
        </button>
      </div>
      {msg ? (
        <p className="text-xs text-error" role="alert">
          {msg}
        </p>
      ) : null}
    </div>
  );
}
