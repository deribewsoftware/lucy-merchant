"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Props = {
  orderId: string;
  canProcessOrders?: boolean;
};

export function AdminConfirmGatewayPayment({
  orderId,
  canProcessOrders = true,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

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
    setConfirmOpen(false);
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
      {!canProcessOrders ? (
        <p className="mt-3 text-xs text-base-content/60">
          You don&apos;t have the{" "}
          <span className="font-mono">orders:admin</span> permission needed to
          confirm gateway payments here.
        </p>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={loading}
            className="btn btn-primary btn-sm mt-3"
          >
            Confirm payment & release to suppliers
          </button>
          <ConfirmDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            title="Confirm gateway payment?"
            description="This marks the order paid, notifies suppliers, and shows the buyer as paid. Only proceed if the charge is correct."
            variant="primary"
            confirmLabel="Confirm & release"
            cancelLabel="Cancel"
            loading={loading}
            onConfirm={confirm}
          />
        </>
      )}
    </div>
  );
}
