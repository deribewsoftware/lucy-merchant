"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { HiOutlineCheckCircle } from "react-icons/hi2";

type Props = { orderId: string };

export function MerchantCompleteOrder({ orderId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function complete() {
    setLoading(true);
    setMsg(null);
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMsg(data.error ?? "Could not complete order");
      return;
    }
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-success/30 bg-success/5 p-5 shadow-sm ring-1 ring-success/10">
      <div className="flex flex-wrap items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/15 text-success">
          <HiOutlineCheckCircle className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-base-content">
            Confirm delivery
          </p>
          <p className="mt-1 text-sm text-base-content/70">
            Delivery confirmed? Mark this order completed to unlock company and
            product reviews.
          </p>
          {msg && (
            <p className="mt-2 text-sm text-error" role="alert">
              {msg}
            </p>
          )}
          <button
            type="button"
            disabled={loading}
            onClick={complete}
            className="btn btn-success btn-sm mt-4 gap-2 rounded-xl sm:btn-md"
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <HiOutlineCheckCircle className="h-4 w-4" />
            )}
            {loading ? "Updating…" : "Mark order completed"}
          </button>
        </div>
      </div>
    </div>
  );
}
