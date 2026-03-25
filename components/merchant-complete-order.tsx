"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { HiOutlineCheckCircle } from "react-icons/hi2";

type Props = {
  orderId: string;
  commissionPaid: boolean;
  /** Supplier recorded their platform commission (when applicable). */
  supplierCommissionPaid: boolean;
  /** Supplier confirmed they received payment for goods (bank/COD). */
  supplierPaymentReceived: boolean;
};

export function MerchantCompleteOrder(props: Props) {
  const { orderId, commissionPaid, supplierPaymentReceived } = props;
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

  if (!commissionPaid) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 shadow-sm ring-1 ring-amber-500/15">
        <div className="flex flex-wrap items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-200">
            <HiOutlineCheckCircle className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground">Pay platform commission first</p>
            <p className="mt-1 text-sm text-muted-foreground">
              After delivery, transfer the commission amount to the platform and use
              &quot;I have paid commission&quot; on this page. Then the supplier must
              confirm they received payment for the goods before you can complete.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!supplierPaymentReceived) {
    return (
      <div className="rounded-2xl border border-info/30 bg-info/5 p-5 shadow-sm ring-1 ring-info/15">
        <div className="flex flex-wrap items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-info/15 text-info">
            <HiOutlineCheckCircle className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground">Waiting for supplier confirmation</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Platform fees are recorded. The supplier must confirm they received
              payment for this order (transfer or COD). Then you can mark the order
              complete and leave reviews.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 shadow-sm ring-1 ring-emerald-500/15">
      <div className="flex flex-wrap items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
          <HiOutlineCheckCircle className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground">Complete your order</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Fees are settled and the supplier confirmed payment. Mark complete to
            unlock company and product reviews.
          </p>
          {msg ? (
            <p className="mt-2 text-sm text-destructive" role="alert">
              {msg}
            </p>
          ) : null}
          <button
            type="button"
            disabled={loading}
            onClick={complete}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600/90 disabled:opacity-60 dark:bg-emerald-600"
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
