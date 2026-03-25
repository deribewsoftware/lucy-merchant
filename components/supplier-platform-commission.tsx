"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Building2, CheckCircle2 } from "lucide-react";
import { CommissionReceiptUpload } from "@/components/commission-receipt-upload";
import { PlatformBankAccountsPanel } from "@/components/platform-bank-accounts-panel";
import { isSupplierPlatformCommissionPaid } from "@/lib/domain/platform-commission";
import type { Order } from "@/lib/domain/types";

type Props = {
  order: Pick<
    Order,
    | "id"
    | "status"
    | "supplierCommissionAmount"
    | "supplierCommissionPaidAt"
    | "supplierCommissionProofImagePath"
  >;
};

export function SupplierPlatformCommissionPanel({ order }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);

  const memoRef = useMemo(
    () => `LM-SUP-COMM-${order.id.slice(0, 8).toUpperCase()}`,
    [order.id],
  );

  if (order.status !== "delivered") return null;

  const owed = Math.round((order.supplierCommissionAmount ?? 0) * 100) / 100;
  if (owed <= 0) return null;

  const paid = isSupplierPlatformCommissionPaid(order);

  async function recordPaid() {
    if (!proofFile) {
      setMsg("Choose a payment screenshot or receipt first.");
      return;
    }
    setLoading(true);
    setMsg(null);
    const fd = new FormData();
    fd.append("proof", proofFile);
    const res = await fetch(`/api/orders/${order.id}/supplier-commission-to-platform`, {
      method: "POST",
      body: fd,
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMsg(data.error ?? "Could not record commission");
      return;
    }
    router.refresh();
  }

  if (paid) {
    return (
      <section className="overflow-hidden rounded-xl border border-accent/25 bg-accent/5 p-3 shadow-sm ring-1 ring-accent/15 sm:p-4">
        <div className="flex flex-wrap items-start gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <CheckCircle2 className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-sm font-bold text-base-content">
              Supplier commission recorded
            </h2>
            <p className="mt-1 text-xs text-base-content/70">
              The buyer can complete this order once they have paid their platform
              commission and you have confirmed you received payment for the goods.
            </p>
            {order.supplierCommissionProofImagePath ? (
              <div className="mt-3 overflow-hidden rounded-lg border border-base-300">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={order.supplierCommissionProofImagePath}
                  alt="Uploaded payment receipt"
                  className="max-h-36 w-full object-contain object-top"
                />
              </div>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-violet-500/35 bg-gradient-to-br from-violet-500/[0.06] to-fuchsia-500/[0.05] p-4 shadow-sm ring-1 ring-violet-500/20 sm:p-5">
      <div className="flex flex-wrap items-start gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-800 dark:text-violet-200">
          <Building2 className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-800/90 dark:text-violet-200/85">
              After delivery · Pay platform
            </p>
            <h2 className="font-display text-sm font-bold text-base-content">
              Supplier platform commission
            </h2>
            <p className="mt-0.5 text-xs text-base-content/70">
              Transfer, upload receipt, then confirm. Buyer cannot complete until
              both fees are recorded.
            </p>
          </div>

          <div className="rounded-lg border border-accent/25 bg-base-100/90 px-2.5 py-2 ring-1 ring-accent/12 dark:bg-base-200/30">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-base-content/50">
              Amount
            </p>
            <p className="font-display text-xl font-bold tabular-nums tracking-tight text-base-content sm:text-2xl">
              {owed.toLocaleString()}{" "}
              <span className="text-base font-semibold text-base-content/55">
                ETB
              </span>
            </p>
          </div>

          <PlatformBankAccountsPanel
            compact
            tone="accent"
            transferMemoHint={memoRef}
            subtitle="Pick a bank, copy details, then transfer with the memo below."
            accountsHeading="Platform accounts"
          />

          <CommissionReceiptUpload
            tone="accent"
            onFileChange={setProofFile}
            disabled={loading}
          />

          {msg ? (
            <p className="text-xs text-error" role="alert">
              {msg}
            </p>
          ) : null}

          <button
            type="button"
            disabled={loading || !proofFile}
            onClick={recordPaid}
            className="btn btn-primary w-full rounded-lg sm:w-auto"
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {loading ? "Submitting…" : "Submit receipt & record payment"}
          </button>
        </div>
      </div>
    </section>
  );
}
