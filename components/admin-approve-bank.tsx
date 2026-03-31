"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  orderId: string;
  /** When false, hide the action (matches `orders:admin` on the API). */
  canProcessOrders?: boolean;
};

export function AdminApproveBank({
  orderId,
  canProcessOrders = true,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function approve() {
    setLoading(true);
    setMsg(null);
    const res = await fetch(`/api/admin/orders/${orderId}/approve-bank`, {
      method: "POST",
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMsg(data.error ?? "Could not approve");
      return;
    }
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-emerald-300/60 bg-emerald-50/90 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
      <h2 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
        Bank transfer review
      </h2>
      <p className="mt-1 text-xs text-emerald-800/90 dark:text-emerald-200/80">
        Approve after you verify the merchant screenshot matches the order
        amount. Suppliers will be notified and the order will move to
        fulfillment.
      </p>
      {msg && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{msg}</p>
      )}
      {!canProcessOrders ? (
        <p className="mt-3 text-xs text-base-content/60">
          You don&apos;t have the{" "}
          <span className="font-mono">orders:admin</span> permission needed to
          approve bank transfers here.
        </p>
      ) : (
        <button
          type="button"
          onClick={approve}
          disabled={loading}
          className="btn btn-success btn-sm mt-3"
        >
          {loading ? (
            <span className="loading loading-spinner loading-xs" />
          ) : null}
          Approve bank payment
        </button>
      )}
    </div>
  );
}
