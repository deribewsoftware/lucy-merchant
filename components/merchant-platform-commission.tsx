"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Building2, CheckCircle2 } from "lucide-react";
import { CommissionReceiptUpload } from "@/components/commission-receipt-upload";
import { PlatformBankAccountsPanel } from "@/components/platform-bank-accounts-panel";
import { isPlatformCommissionPaid } from "@/lib/domain/platform-commission";
import type { Order } from "@/lib/domain/types";

type Props = {
  order: Pick<
    Order,
    | "id"
    | "status"
    | "commissionAmount"
    | "merchantCommissionPaidAt"
    | "supplierPayoutRecordedAt"
    | "merchantCommissionProofImagePath"
  >;
};

export function MerchantPlatformCommissionPanel({ order }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);

  const memoRef = useMemo(
    () => `LM-COMM-${order.id.slice(0, 8).toUpperCase()}`,
    [order.id],
  );

  if (order.status !== "delivered") return null;

  const owed = Math.round((order.commissionAmount ?? 0) * 100) / 100;
  if (owed <= 0) return null;

  const paid = isPlatformCommissionPaid(order);

  async function recordPaid() {
    if (!proofFile) {
      setMsg("Choose a payment screenshot or receipt first.");
      return;
    }
    setLoading(true);
    setMsg(null);
    const fd = new FormData();
    fd.append("proof", proofFile);
    const res = await fetch(`/api/orders/${order.id}/commission-to-platform`, {
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
      <section className="overflow-hidden rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3 shadow-sm ring-1 ring-emerald-500/15 sm:p-4">
        <div className="flex flex-wrap items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-sm font-bold text-foreground">
              Merchant platform commission recorded
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {order.merchantCommissionPaidAt
                ? "You recorded this payment. The supplier must also record their platform fee (if any) before you can complete."
                : "Commission was recorded (including legacy supplier-recorded orders). Complete once the supplier confirms payment and records their fee if applicable."}
            </p>
            {order.merchantCommissionProofImagePath ? (
              <div className="mt-3 overflow-hidden rounded-lg border border-border/50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={order.merchantCommissionProofImagePath}
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
    <section className="overflow-hidden rounded-2xl border border-amber-500/35 bg-gradient-to-br from-amber-500/[0.06] to-orange-500/[0.05] p-4 shadow-sm ring-1 ring-amber-500/20 sm:p-5">
      <div className="flex flex-wrap items-start gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-200">
          <Building2 className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-900/80 dark:text-amber-200/80">
              After delivery · Pay platform
            </p>
            <h2 className="font-display text-sm font-bold text-foreground">
              Merchant platform commission
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Transfer the fee, upload your receipt, then confirm. Same bank list as
              suppliers; include the memo.
            </p>
          </div>

          <div className="rounded-lg border border-primary/20 bg-background/90 px-2.5 py-2 ring-1 ring-primary/10 dark:bg-background/50">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Amount
            </p>
            <p className="font-display text-xl font-bold tabular-nums tracking-tight text-foreground sm:text-2xl">
              {owed.toLocaleString()}{" "}
              <span className="text-base font-semibold text-muted-foreground">
                ETB
              </span>
            </p>
          </div>

          <PlatformBankAccountsPanel
            compact
            tone="primary"
            transferMemoHint={memoRef}
            subtitle="Pick a bank, copy details, then transfer with the memo below."
            accountsHeading="Platform accounts"
          />

          <CommissionReceiptUpload
            tone="primary"
            onFileChange={setProofFile}
            disabled={loading}
          />

          {msg ? (
            <p className="text-xs text-destructive" role="alert">
              {msg}
            </p>
          ) : null}

          <button
            type="button"
            disabled={loading || !proofFile}
            onClick={recordPaid}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50 sm:w-auto sm:px-4 sm:text-sm"
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
