"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  defaultSupplierNextChoice,
  supplierAllowedNextStatuses,
} from "@/lib/domain/order-flow";
import {
  isSupplierPositiveTransition,
  orderStatusLabel,
  supplierActionButtonLabel,
} from "@/lib/domain/order-presentations";
import type { Order, OrderStatus } from "@/lib/domain/types";

function supplierConfirmCopy(next: OrderStatus): {
  title: string;
  description: ReactNode;
  variant: "danger" | "primary" | "neutral";
  confirmLabel: string;
} {
  if (next === "rejected") {
    return {
      title: "Reject this order?",
      description: (
        <>
          You must give a clear written reason (buyer and platform may review it).{" "}
          <span className="font-medium text-error/90">This cannot be undone.</span> Suppliers are
          limited to <span className="font-medium">3 rejections per rolling 7 days</span>.
        </>
      ),
      variant: "danger",
      confirmLabel: "Reject order",
    };
  }
  if (next === "accepted") {
    return {
      title: "Accept this order?",
      description:
        "You are committing to fulfill this order. You can update status again as you prepare, ship, and deliver.",
      variant: "primary",
      confirmLabel: "Accept order",
    };
  }
  if (next === "in_progress") {
    return {
      title: "Start fulfillment?",
      description:
        "Mark this order as in progress when you begin preparing or shipping goods.",
      variant: "neutral",
      confirmLabel: "Start fulfillment",
    };
  }
  if (next === "delivered") {
    return {
      title: "Mark as delivered?",
      description:
        "Confirm the goods have reached the buyer. Commission and completion steps follow after delivery.",
      variant: "primary",
      confirmLabel: "Mark delivered",
    };
  }
  return {
    title: `Set status to ${orderStatusLabel(next)}?`,
    description: "This will update the order for you and the buyer.",
    variant: "neutral",
    confirmLabel: "Confirm",
  };
}

type OrderSlice = Pick<
  Order,
  "status" | "paymentMethod" | "paymentStatus"
>;

type Props = {
  orderId: string;
  order: OrderSlice;
  /** Buyer → platform commission recorded (merchant-paid or legacy). */
  platformCommissionPaid: boolean;
  /** Supplier → platform commission recorded when a fee applies. */
  supplierCommissionPaid: boolean;
  /** ETB owed by supplier to platform on this order (0 = none). */
  supplierCommissionOwed: number;
  /** Rejections in the last 7 days (same account) — for visibility before attempting another. */
  rejectionsThisWeek?: number;
};

export function SupplierOrderActions({
  orderId,
  order,
  platformCommissionPaid,
  supplierCommissionPaid,
  supplierCommissionOwed,
  rejectionsThisWeek = 0,
}: Props) {
  const router = useRouter();
  const current = order.status;
  const allowed = supplierAllowedNextStatuses(order);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingNext, setPendingNext] = useState<OrderStatus | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    if (!pendingNext) setRejectReason("");
  }, [pendingNext]);

  if (current === "completed" || current === "rejected") {
    return (
      <div className="rounded-xl border border-base-300 bg-base-200/30 px-3 py-2 text-xs text-base-content/60">
        Closed —{" "}
        <span className="font-medium capitalize text-base-content">
          {orderStatusLabel(current)}
        </span>
      </div>
    );
  }

  if (current === "delivered") {
    const needSupplierFee =
      supplierCommissionOwed > 0 && !supplierCommissionPaid;
    return (
      <div className="max-w-md rounded-xl border border-info/30 bg-info/5 px-3 py-2 text-xs text-base-content/70">
        <span className="font-semibold text-info">Delivered</span>
        {" — "}
        {!platformCommissionPaid
          ? "The buyer pays their platform commission after delivery and records it first."
          : needSupplierFee
            ? "Pay and record your supplier platform commission on this order — then the buyer can complete after you confirm you received payment for the goods."
            : "Platform fees are recorded — the buyer can complete once they confirm everything."}
      </div>
    );
  }

  if (allowed.length === 0) {
    return (
      <div className="rounded-xl border border-base-300 bg-base-200/30 px-3 py-2 text-xs text-base-content/60">
        {current === "pending" &&
        order.paymentMethod === "bank_transfer" &&
        order.paymentStatus !== "paid" ? (
          <>
            Waiting for the buyer to transfer and upload proof, then confirm payment received
            above.
          </>
        ) : (
          <>
            Status:{" "}
            <span className="font-medium capitalize text-base-content">
              {orderStatusLabel(current)}
            </span>
            <span className="text-base-content/50"> — no updates available.</span>
          </>
        )}
      </div>
    );
  }

  async function save(next: OrderStatus) {
    if (next === "rejected") {
      const r = rejectReason.trim();
      if (r.length < 20) {
        setMsg("Write a clear reason for the buyer (at least 20 characters).");
        return;
      }
    }
    setLoading(true);
    setMsg(null);
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        next === "rejected"
          ? { status: next, rejectionReason: rejectReason.trim() }
          : { status: next },
      ),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMsg(data.error ?? "Update failed");
      return;
    }
    setPendingNext(null);
    router.refresh();
  }

  const positive = allowed.filter((s) => isSupplierPositiveTransition(s));
  const primary =
    positive.find((s) => s === defaultSupplierNextChoice(order)) ??
    positive[0];

  const dialogCopy = pendingNext ? supplierConfirmCopy(pendingNext) : null;

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      {rejectionsThisWeek >= 2 && allowed.includes("rejected") ? (
        <p className="text-xs text-amber-800/90 dark:text-amber-200/90">
          You have rejected {rejectionsThisWeek} order
          {rejectionsThisWeek === 1 ? "" : "s"} in the last 7 days (max 3).
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        {primary ? (
          <button
            type="button"
            disabled={loading}
            onClick={() => setPendingNext(primary)}
            className="btn btn-primary btn-sm"
          >
            {supplierActionButtonLabel(primary)}
          </button>
        ) : null}
        {allowed.includes("rejected") && primary !== "rejected" ? (
          <button
            type="button"
            disabled={loading}
            onClick={() => setPendingNext("rejected")}
            className="btn btn-outline btn-error btn-sm border-error/40"
          >
            Reject order
          </button>
        ) : null}
      </div>

      {msg && pendingNext !== "rejected" ? (
        <p className="text-xs text-error" role="alert">
          {msg}
        </p>
      ) : null}

      {dialogCopy ? (
        <ConfirmDialog
          open={pendingNext !== null}
          onOpenChange={(o) => !o && setPendingNext(null)}
          title={dialogCopy.title}
          description={dialogCopy.description}
          variant={dialogCopy.variant}
          confirmLabel={dialogCopy.confirmLabel}
          cancelLabel="Go back"
          loading={loading}
          errorMessage={pendingNext === "rejected" ? msg : null}
          onConfirm={async () => {
            if (pendingNext) await save(pendingNext);
          }}
        >
          {pendingNext === "rejected" ? (
            <div className="space-y-2">
              <label className="block text-left text-xs font-semibold text-base-content/80">
                Rejection reason (required)
              </label>
              <textarea
                className="textarea textarea-bordered min-h-[120px] w-full text-sm"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain clearly why you cannot fulfill — e.g. stock, capacity, delivery area…"
                disabled={loading}
              />
              <p className="text-left text-[11px] text-base-content/50">
                {rejectReason.trim().length}/2000 · minimum 20 characters
              </p>
            </div>
          ) : undefined}
        </ConfirmDialog>
      ) : null}
    </div>
  );
}
