"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Banknote } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { getCompanySettlementAccounts } from "@/lib/domain/company-settlement-accounts";
import type { Company, Order } from "@/lib/domain/types";

type Props = {
  order: Pick<
    Order,
    "id" | "status" | "paymentMethod" | "paymentStatus" | "totalPrice"
  >;
  /** Your company — settlement account the buyer should pay into (bank transfer). */
  company?: Pick<
    Company,
    | "id"
    | "name"
    | "settlementBankAccounts"
    | "settlementBankName"
    | "settlementAccountName"
    | "settlementAccountNumber"
  > | null;
};

/** Supplier confirms the buyer paid (bank transfer or COD). Platform commission is recorded by the buyer after delivery. */
export function SupplierPaymentActions({ order, company }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [verified, setVerified] = useState(false);

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
    setConfirmOpen(false);
    setVerified(false);
    router.refresh();
  }

  const showConfirmPaid =
    order.paymentStatus === "pending" &&
    order.status === "pending" &&
    (order.paymentMethod === "bank_transfer" || order.paymentMethod === "cod");

  if (!showConfirmPaid) return null;

  const totalLabel = `${order.totalPrice.toLocaleString()} ETB`;
  const isBank = order.paymentMethod === "bank_transfer";

  return (
    <div className="space-y-4 rounded-2xl border border-secondary/30 bg-secondary/5 p-4 sm:p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-base-content/50">
        Confirm buyer payment
      </p>

      <div className="rounded-xl border border-secondary/25 bg-base-100/80 p-4 ring-1 ring-secondary/10">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-base-content/50">
          Amount to verify
        </p>
        <p className="mt-1 font-display text-2xl font-bold tabular-nums text-base-content">
          {totalLabel}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-base-content/70">
          {isBank
            ? "Log in to your company bank account and confirm this exact total has been received (after any fees) before you confirm below."
            : "Confirm only when you and the buyer have agreed how cash will be collected, and the order total matches what you expect to receive."}
        </p>
        {isBank && company ? (
          <div className="mt-4 space-y-2 rounded-lg border border-base-300/60 bg-base-200/30 px-3 py-2.5 text-xs text-base-content/80">
            <p className="font-semibold text-base-content">{company.name}</p>
            {(() => {
              const rows = getCompanySettlementAccounts(company).filter(
                (a) => a.bankName.trim() && a.accountNumber.trim(),
              );
              if (rows.length === 0) {
                return (
                  <p className="text-warning">
                    Add settlement bank details on your company profile so buyers know where to pay.
                  </p>
                );
              }
              return rows.map((a, i) => (
                <div
                  key={a.id}
                  className="rounded-md border border-base-300/50 bg-base-100/50 px-2 py-1.5"
                >
                  {rows.length > 1 ? (
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-base-content/45">
                      Account {i + 1}
                    </p>
                  ) : null}
                  <p>
                    <span className="text-base-content/55">Bank: </span>
                    {a.bankName}
                  </p>
                  {a.accountName.trim() ? (
                    <p>
                      <span className="text-base-content/55">Account name: </span>
                      {a.accountName}
                    </p>
                  ) : null}
                  <p className="font-mono">
                    <span className="text-base-content/55">Account no.: </span>
                    {a.accountNumber}
                  </p>
                </div>
              ));
            })()}
          </div>
        ) : null}
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-base-300/70 bg-base-100/50 p-3 text-sm text-base-content/85">
        <input
          type="checkbox"
          className="checkbox checkbox-secondary mt-0.5 shrink-0"
          checked={verified}
          onChange={(e) => setVerified(e.target.checked)}
        />
        <span>
          I have checked the payment against my account (or COD arrangement) and the amount matches{" "}
          <span className="font-semibold tabular-nums">{totalLabel}</span>.
        </span>
      </label>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-base-content/75">
          After you confirm, you cannot reject this order — the buyer is committed.
        </p>
        <button
          type="button"
          disabled={loading || !verified}
          onClick={() => setConfirmOpen(true)}
          className="btn btn-secondary btn-sm shrink-0 gap-2"
        >
          <Banknote className="h-4 w-4" />
          Confirm buyer payment
        </button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirm buyer payment?"
        description={
          isBank
            ? "You are stating that the transfer for this order total has arrived in your company account. This unlocks fulfillment and cannot be reversed from here."
            : "You are confirming the agreed cash collection for this order. This unlocks fulfillment and cannot be reversed from here."
        }
        variant="primary"
        confirmLabel="Confirm payment"
        cancelLabel="Cancel"
        loading={loading}
        onConfirm={confirmBuyerPaid}
      />
      {msg ? (
        <p className="text-xs text-error" role="alert">
          {msg}
        </p>
      ) : null}
    </div>
  );
}
