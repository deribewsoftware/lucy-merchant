"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { orderId: string };

export function AdminConfirmGatewayPayment({ orderId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function confirm() {
    setLoading(true);
    setMsg(null);
    const res = await fetch(
      `/api/admin/orders/${orderId}/confirm-gateway-payment`,
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

  return (
    <div className="rounded-xl border border-sky-300/60 bg-sky-50/90 p-4 dark:border-sky-900 dark:bg-sky-950/40">
      <h2 className="text-sm font-semibold text-sky-900 dark:text-sky-100">
        Card / Chapa payment
      </h2>
      <p className="mt-1 text-xs text-sky-800/90 dark:text-sky-200/80">
        The gateway reported a successful charge. Confirm here to mark the order
        paid, notify suppliers, and show the buyer as paid.
      </p>
      {msg && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{msg}</p>
      )}
      <button
        type="button"
        onClick={confirm}
        disabled={loading}
        className="btn btn-primary btn-sm mt-3"
      >
        {loading ? (
          <span className="loading loading-spinner loading-xs" />
        ) : null}
        Confirm payment & release to suppliers
      </button>
    </div>
  );
}
