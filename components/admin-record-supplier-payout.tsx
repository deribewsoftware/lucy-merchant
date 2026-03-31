"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { HiOutlineBanknotes, HiOutlineChevronDown } from "react-icons/hi2";
import { PlatformBankAccountsPanel } from "@/components/platform-bank-accounts-panel";

type Props = { orderId: string; canProcessOrders?: boolean };

export function AdminRecordSupplierPayout({
  orderId,
  canProcessOrders = true,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [banksOpen, setBanksOpen] = useState(false);

  const memoRef = useMemo(
    () => `LM-COMM-${orderId.slice(0, 8).toUpperCase()}`,
    [orderId],
  );

  async function record() {
    setLoading(true);
    setMsg(null);
    const res = await fetch(`/api/admin/orders/${orderId}/supplier-payout`, {
      method: "POST",
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMsg(data.error ?? "Could not record payout");
      return;
    }
    router.refresh();
  }

  return (
    <div className="overflow-hidden rounded-xl border border-secondary/35 bg-gradient-to-br from-secondary/5 to-base-200/40 shadow-sm">
      <div className="p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
            <HiOutlineBanknotes className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <h2 className="text-sm font-semibold text-base-content">
              Buyer (merchant) platform commission
            </h2>
            <p className="text-xs leading-relaxed text-base-content/70">
              Record when the buyer has paid their order fee to the platform (or you
              confirmed receipt). The buyer still needs the supplier fee recorded
              (if any) before they can complete.
            </p>
            {msg ? (
              <p className="text-xs text-error" role="alert">
                {msg}
              </p>
            ) : null}
            {!canProcessOrders ? (
              <p className="mt-2 text-xs text-base-content/60">
                Recording requires the{" "}
                <span className="font-mono">orders:admin</span> permission.
              </p>
            ) : (
              <button
                type="button"
                onClick={record}
                disabled={loading}
                className="btn btn-secondary btn-sm mt-1"
              >
                {loading ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : null}
                Record buyer commission received
              </button>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setBanksOpen((o) => !o)}
          className="btn btn-ghost btn-sm mt-4 w-full gap-2 border border-base-300/80 text-base-content/80"
          aria-expanded={banksOpen}
        >
          <HiOutlineChevronDown
            className={`h-4 w-4 shrink-0 transition ${banksOpen ? "rotate-180" : ""}`}
          />
          {banksOpen ? "Hide" : "Show"} platform receiving accounts (Ethiopia)
        </button>
      </div>

      {banksOpen ? (
        <div className="border-t border-base-300/60 bg-base-100/50 px-3 py-3 sm:px-4">
          <PlatformBankAccountsPanel
            transferMemoHint={memoRef}
            subtitle="Share these with merchants or verify a transfer against any listed account."
          />
        </div>
      ) : null}
    </div>
  );
}
