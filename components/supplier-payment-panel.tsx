"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { getCompanySettlementAccounts } from "@/lib/domain/company-settlement-accounts";
import type { Company, Order } from "@/lib/domain/types";

type Props = {
  order: Order;
  company: Company | undefined;
};

/** Buyer pays supplier directly — bank details from the supplier company profile. */
export function SupplierPaymentPanel({ order, company }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function copyText(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }

  if (order.paymentMethod !== "bank_transfer") return null;

  if (order.status === "awaiting_bank_review") {
    return (
      <div className="rounded-xl border border-amber-300/60 bg-amber-50/80 p-3 shadow-sm dark:border-amber-800 dark:bg-amber-950/30 sm:p-4">
        <h2 className="lm-heading-card text-base text-foreground">Legacy platform review</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This order is waiting for admin verification of a platform transfer.
        </p>
        {order.bankProofImagePath ? (
          <div className="mt-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={order.bankProofImagePath}
              alt="Payment receipt"
              className="mt-2 max-h-64 rounded-xl border border-base-300 object-contain"
            />
          </div>
        ) : null}
      </div>
    );
  }

  if (order.status !== "pending" || order.paymentStatus === "paid") {
    return null;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const file = fd.get("file");
    if (!(file instanceof File) || file.size === 0) {
      setMsg("Choose a screenshot");
      return;
    }
    setLoading(true);
    setMsg(null);
    const up = new FormData();
    up.append("file", file);
    const res = await fetch(`/api/orders/${order.id}/bank-proof`, {
      method: "POST",
      body: up,
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMsg(data.error ?? "Upload failed");
      return;
    }
    router.refresh();
  }

  const accounts = company ? getCompanySettlementAccounts(company) : [];
  const usableAccounts = accounts.filter(
    (a) => a.bankName.trim() && a.accountNumber.trim(),
  );

  const memoHint = `LM-ORD-${order.id.slice(0, 8).toUpperCase()}`;
  const allDetails =
    usableAccounts.length > 0
      ? (() => {
          const lines: string[] = [`Supplier: ${company?.name ?? ""}`];
          usableAccounts.forEach((a, i) => {
            if (usableAccounts.length > 1) lines.push(`— Account ${i + 1} —`);
            lines.push(`Bank: ${a.bankName}`);
            if (a.accountName.trim()) lines.push(`Account name: ${a.accountName}`);
            lines.push(`Account number: ${a.accountNumber}`);
          });
          lines.push(`Amount: ${order.totalPrice.toLocaleString()} ETB`);
          lines.push(`Memo: ${memoHint}`);
          return lines.join("\n");
        })()
      : "";

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 shadow-sm ring-1 ring-primary/10 sm:p-4">
      <h2 className="lm-heading-card text-base text-foreground">Pay the supplier</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Transfer {order.totalPrice.toLocaleString()} ETB to the supplier account below, then
        upload proof. The supplier will confirm receipt before accepting the order.
      </p>
      {usableAccounts.length > 0 ? (
        <div className="mt-3 space-y-2">
          <div className="rounded-lg border border-dashed border-primary/30 bg-base-100/90 px-2.5 py-1.5 text-sm">
            <span className="text-xs text-base-content/55">Suggested memo: </span>
            <span className="font-mono tabular-nums">{memoHint}</span>
            <button
              type="button"
              onClick={() => copyText(memoHint, "memo")}
              className="ml-2 inline-flex items-center gap-1 rounded-lg border border-base-300 px-2 py-0.5 text-xs font-medium hover:bg-base-200"
            >
              {copied === "memo" ? (
                <Check className="h-3 w-3 text-success" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              Copy
            </button>
          </div>
          <div className="space-y-3">
            <div className="rounded-lg border border-base-300 bg-base-100 p-3 text-sm">
              <p className="text-xs text-base-content/50">Supplier</p>
              <p className="font-medium">{company?.name ?? "—"}</p>
            </div>
            {usableAccounts.map((a, i) => (
              <dl
                key={a.id}
                className="space-y-1.5 rounded-lg border border-base-300 bg-base-100 p-3 text-sm"
              >
                {usableAccounts.length > 1 ? (
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-base-content/45">
                    Account {i + 1}
                  </p>
                ) : null}
                <div>
                  <dt className="text-xs text-base-content/50">Bank</dt>
                  <dd className="font-medium">{a.bankName}</dd>
                </div>
                {a.accountName.trim() ? (
                  <div>
                    <dt className="text-xs text-base-content/50">Account name</dt>
                    <dd>{a.accountName}</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-xs text-base-content/50">Account number</dt>
                  <dd className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] sm:text-sm">{a.accountNumber}</span>
                    <button
                      type="button"
                      onClick={() => copyText(a.accountNumber, `acct-${a.id}`)}
                      className="inline-flex items-center gap-1 rounded-lg border border-base-300 px-2 py-0.5 text-xs hover:bg-base-200"
                    >
                      {copied === `acct-${a.id}` ? (
                        <Check className="h-3 w-3 text-success" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      Copy #
                    </button>
                  </dd>
                </div>
              </dl>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => copyText(allDetails, "all")}
              className="btn btn-outline btn-sm gap-1 rounded-xl border-primary/30"
            >
              {copied === "all" ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              Copy payment details
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-3 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
          This supplier has not added settlement bank details yet. Contact them or support
          before paying.
        </p>
      )}
      <form onSubmit={onSubmit} className="mt-3 space-y-2">
        <label className="block text-sm font-medium text-base-content">
          Transfer receipt (screenshot)
          <input
            type="file"
            name="file"
            accept="image/jpeg,image/png,image/webp"
            className="file-input file-input-bordered file-input-sm mt-2 w-full max-w-md"
            required
          />
        </label>
        {msg && (
          <p className="text-sm text-error" role="alert">
            {msg}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-sm rounded-xl"
        >
          {loading ? (
            <span className="loading loading-spinner loading-sm" />
          ) : null}
          Save proof
        </button>
      </form>
    </div>
  );
}
