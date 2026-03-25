"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Order } from "@/lib/domain/types";
import type { PlatformBankAccount } from "@/lib/data/ethiopian-banks";

type Props = {
  order: Order;
  bank: PlatformBankAccount | undefined;
};

export function MerchantBankTransferPanel({ order, bank }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (order.paymentMethod !== "bank_transfer") return null;

  if (order.status === "awaiting_bank_review") {
    return (
      <div className="rounded-2xl border border-amber-300/60 bg-amber-50/80 p-5 shadow-sm dark:border-amber-800 dark:bg-amber-950/30">
        <h2 className="font-semibold text-base-content">Bank transfer</h2>
        <p className="mt-2 text-sm text-base-content/75">
          Your payment screenshot was submitted. An admin will verify it and
          release the order to suppliers.
        </p>
        {order.bankProofImagePath ? (
          <div className="mt-4">
            <p className="text-xs font-medium text-base-content/55">Uploaded</p>
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

  if (order.status !== "awaiting_payment") return null;

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

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 shadow-sm ring-1 ring-primary/10">
      <h2 className="font-semibold text-base-content">Bank transfer</h2>
      <p className="mt-2 text-sm text-base-content/75">
        Transfer {order.totalPrice.toLocaleString()} ETB to the account below,
        then upload a screenshot of the receipt or SMS confirmation.
      </p>
      {bank ? (
        <dl className="mt-4 space-y-2 rounded-xl border border-base-300 bg-base-100 p-4 text-sm">
          <div>
            <dt className="text-xs text-base-content/50">Bank</dt>
            <dd className="font-medium"> {bank.bankName}</dd>
          </div>
          <div>
            <dt className="text-xs text-base-content/50">Account name</dt>
            <dd>{bank.accountName}</dd>
          </div>
          <div>
            <dt className="text-xs text-base-content/50">Account number</dt>
            <dd className="font-mono text-[11px] sm:text-sm">{bank.accountNumber}</dd>
          </div>
          {bank.branch ? (
            <div>
              <dt className="text-xs text-base-content/50">Branch</dt>
              <dd>{bank.branch}</dd>
            </div>
          ) : null}
        </dl>
      ) : (
        <p className="mt-2 text-sm text-warning">Bank details missing — contact support.</p>
      )}
      {bank?.qrReceiptUrl ? (
        <div className="mt-4">
          <p className="text-xs font-medium text-base-content/55">QR / receipt</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bank.qrReceiptUrl}
            alt="Bank QR receipt"
            className="mt-2 max-h-48 rounded border border-base-300"
          />
        </div>
      ) : (
        <p className="mt-3 text-xs text-base-content/50">
          Add a QR image URL in platform bank data for this account to show a
          scannable code here.
        </p>
      )}
      <form onSubmit={onSubmit} className="mt-5 space-y-3">
        <label className="block text-sm font-medium text-base-content">
          Payment screenshot
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
          Submit for admin review
        </button>
      </form>
    </div>
  );
}
