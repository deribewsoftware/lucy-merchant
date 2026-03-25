"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";

type Props = { orderId: string };

/** Admin records supplier → platform commission (same as supplier self-confirm). */
export function AdminRecordSupplierPlatformFee({ orderId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function record() {
    setLoading(true);
    setMsg(null);
    const res = await fetch(`/api/admin/orders/${orderId}/supplier-commission`, {
      method: "POST",
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMsg(data.error ?? "Could not record");
      return;
    }
    router.refresh();
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/[0.06] to-base-200/40 shadow-sm">
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-700 dark:text-violet-300">
            <HiOutlineBuildingOffice2 className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <h2 className="text-sm font-semibold text-base-content">
              Supplier platform commission
            </h2>
            <p className="text-xs leading-relaxed text-base-content/70">
              Record when the supplier has paid their marketplace fee for this order
              (or you confirmed off-platform). The buyer can complete only after both
              buyer and supplier fees are recorded.
            </p>
            {msg ? (
              <p className="text-xs text-error" role="alert">
                {msg}
              </p>
            ) : null}
            <button
              type="button"
              onClick={record}
              disabled={loading}
              className="btn btn-sm mt-1 border-violet-500/40 bg-violet-500/10 text-violet-900 hover:bg-violet-500/20 dark:text-violet-200"
            >
              {loading ? (
                <span className="loading loading-spinner loading-xs" />
              ) : null}
              Record supplier commission received
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
