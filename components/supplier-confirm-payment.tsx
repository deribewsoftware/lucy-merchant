"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PaymentMethod } from "@/lib/domain/types";

type Props = {
  orderId: string;
  /** Show when order.paymentStatus is pending and a payment row exists */
  show: boolean;
  paymentMethod?: PaymentMethod;
  /** supplier = fulfillment copy; admin = platform audit copy */
  audience?: "supplier" | "admin";
};

export function SupplierConfirmPayment({
  orderId,
  show,
  paymentMethod,
  audience = "supplier",
}: Props) {
  const router = useRouter();
  const [ref, setRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!show) return null;

  async function confirm() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/orders/${orderId}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transactionRef:
          paymentMethod === "bank_transfer" ? ref.trim() || undefined : undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not confirm payment");
      return;
    }
    router.refresh();
  }

  const isAdmin = audience === "admin";

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
      <h2 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
        {isAdmin ? "Payment (admin)" : "Payment"}
      </h2>
      <p className="mt-1 text-xs text-emerald-800/90 dark:text-emerald-200/80">
        {isAdmin
          ? paymentMethod === "bank_transfer"
            ? "Record that settlement is confirmed for this order. Optional reference for the ledger."
            : "Record COD collection for platform records and buyer visibility."
          : paymentMethod === "bank_transfer"
            ? "Confirm once funds are visible on your account. Optional reference helps reconciliation."
            : "Confirm when cash on delivery has been collected."}
      </p>
      {(paymentMethod === "bank_transfer" ||
        paymentMethod === "chapa" ||
        paymentMethod === "telebirr") && (
        <input
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          placeholder="Bank reference / TX id (optional)"
          className="input input-bordered input-sm mt-3 w-full max-w-md bg-white dark:bg-zinc-950"
        />
      )}
      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
      <button
        type="button"
        onClick={confirm}
        disabled={loading}
        className="btn btn-success btn-sm mt-3"
      >
        {loading ? (
          <span className="loading loading-spinner loading-xs" />
        ) : null}
        {isAdmin ? "Mark payment recorded" : "Mark payment received"}
      </button>
    </div>
  );
}
