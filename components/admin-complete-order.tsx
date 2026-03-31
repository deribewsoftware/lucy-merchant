"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { HiOutlineCheckCircle, HiOutlineShieldExclamation } from "react-icons/hi2";
import { ImagePreviewLightbox } from "@/components/image-preview-lightbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  canAdminCompleteOrder,
  orderRequiresAdminProofAcknowledgment,
} from "@/lib/domain/admin-order-completion";
import type { Order } from "@/lib/domain/types";

type OrderSlice = Pick<
  Order,
  | "status"
  | "paymentStatus"
  | "commissionAmount"
  | "supplierCommissionAmount"
  | "merchantCommissionPaidAt"
  | "supplierCommissionPaidAt"
  | "supplierPayoutRecordedAt"
  | "merchantCommissionProofImagePath"
  | "supplierCommissionProofImagePath"
  | "commissionDeadlineAt"
  | "adminCommissionProofsAcknowledgedAt"
>;

type Props = {
  orderId: string;
  order: OrderSlice;
  canCompleteOrders: boolean;
  /** `orders:admin` — record commission proof review (API matches). */
  canAcknowledgeProofs?: boolean;
};

export function AdminCompleteOrder({
  orderId,
  order,
  canCompleteOrders,
  canAcknowledgeProofs = true,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<"ack" | "complete" | null>(null);
  const [confirmAction, setConfirmAction] = useState<"ack" | "complete" | null>(
    null,
  );
  const [msg, setMsg] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<{
    src: string;
    alt: string;
  } | null>(null);

  if (order.status === "completed" || order.status === "rejected") {
    return null;
  }

  if (order.status !== "delivered") {
    return null;
  }

  const gate = canAdminCompleteOrder(order as Order);
  const needsFee = orderRequiresAdminProofAcknowledgment(order as Order);

  async function acknowledge() {
    setLoading("ack");
    setMsg(null);
    const res = await fetch(
      `/api/admin/orders/${orderId}/acknowledge-proofs`,
      { method: "POST" },
    );
    const data = await res.json().catch(() => ({}));
    setLoading(null);
    if (!res.ok) {
      setMsg(data.error ?? "Could not save review");
      return;
    }
    setConfirmAction(null);
    router.refresh();
  }

  async function complete() {
    setLoading("complete");
    setMsg(null);
    const res = await fetch(`/api/admin/orders/${orderId}/complete`, {
      method: "POST",
    });
    const data = await res.json().catch(() => ({}));
    setLoading(null);
    if (!res.ok) {
      setMsg(data.error ?? "Could not complete order");
      return;
    }
    setConfirmAction(null);
    router.refresh();
  }

  const deadlineLabel = order.commissionDeadlineAt
    ? new Date(order.commissionDeadlineAt).toLocaleString()
    : null;

  return (
    <section className="overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.06] to-base-200/40 p-4 shadow-md ring-1 ring-primary/15 sm:p-5">
      <div className="flex flex-wrap items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <HiOutlineCheckCircle className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              Admin · complete order
            </p>
            <h2 className="font-display mt-0.5 text-base font-bold text-base-content">
              Close order (commission verified)
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-base-content/70">
              Only admins with the{" "}
              <span className="font-mono text-[10px]">orders:complete</span>{" "}
              permission may complete delivered orders here. Review uploaded
              commission receipts, confirm, then mark completed.
            </p>
            {deadlineLabel && needsFee ? (
              <p className="mt-2 text-xs text-warning">
                Commission payment grace ends:{" "}
                <span className="font-semibold tabular-nums">{deadlineLabel}</span>{" "}
                — unpaid fees suspend the merchant or supplier account after this time.
              </p>
            ) : null}
          </div>

          {!canCompleteOrders ? (
            <p className="flex items-start gap-2 rounded-lg border border-base-300 bg-base-200/40 px-3 py-2 text-sm text-base-content/80">
              <HiOutlineShieldExclamation className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              Your admin account cannot complete orders. An administrator must
              remove <span className="font-mono text-xs">orders:complete</span>{" "}
              from your denied permissions, or use an account that has it.
            </p>
          ) : null}

          {needsFee &&
          !order.adminCommissionProofsAcknowledgedAt &&
          !canAcknowledgeProofs ? (
            <p className="flex items-start gap-2 rounded-lg border border-base-300 bg-base-200/40 px-3 py-2 text-sm text-base-content/80">
              <HiOutlineShieldExclamation className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              Recording commission proof review requires the{" "}
              <span className="font-mono text-xs">orders:admin</span> permission.
              Ask a system administrator to update your role, or have another admin
              record the review first.
            </p>
          ) : null}

          {needsFee ? (
            <div className="space-y-3 rounded-xl border border-base-300/80 bg-base-100/80 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-base-content/55">
                Commission payment screenshots
              </p>
              <p className="text-[11px] text-base-content/50">
                Tap an image to open a full-size preview.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {order.commissionAmount > 0 ? (
                  <div>
                    <p className="text-[11px] font-medium text-base-content/60">
                      Merchant → platform
                    </p>
                    {order.merchantCommissionProofImagePath ? (
                      <button
                        type="button"
                        className="group mt-1 w-full cursor-zoom-in overflow-hidden rounded-xl border-2 border-base-200 bg-base-200/30 text-left shadow-sm ring-1 ring-base-300/50 transition hover:border-primary/35 hover:ring-primary/25"
                        onClick={() =>
                          setImagePreview({
                            src: order.merchantCommissionProofImagePath!,
                            alt: "Merchant platform commission receipt",
                          })
                        }
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={order.merchantCommissionProofImagePath}
                          alt="Merchant commission receipt — tap to enlarge"
                          className="max-h-[min(280px,40vh)] w-full object-contain object-top"
                        />
                        <span className="block bg-base-200/40 px-2 py-1 text-center text-[10px] font-medium text-base-content/60 group-hover:text-primary">
                          View full size
                        </span>
                      </button>
                    ) : (
                      <p className="mt-1 text-xs text-base-content/55">
                        No screenshot on file (recorded without upload).
                      </p>
                    )}
                  </div>
                ) : null}
                {(order.supplierCommissionAmount ?? 0) > 0 ? (
                  <div>
                    <p className="text-[11px] font-medium text-base-content/60">
                      Supplier → platform
                    </p>
                    {order.supplierCommissionProofImagePath ? (
                      <button
                        type="button"
                        className="group mt-1 w-full cursor-zoom-in overflow-hidden rounded-xl border-2 border-base-200 bg-base-200/30 text-left shadow-sm ring-1 ring-base-300/50 transition hover:border-primary/35 hover:ring-primary/25"
                        onClick={() =>
                          setImagePreview({
                            src: order.supplierCommissionProofImagePath!,
                            alt: "Supplier platform commission receipt",
                          })
                        }
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={order.supplierCommissionProofImagePath}
                          alt="Supplier commission receipt — tap to enlarge"
                          className="max-h-[min(280px,40vh)] w-full object-contain object-top"
                        />
                        <span className="block bg-base-200/40 px-2 py-1 text-center text-[10px] font-medium text-base-content/60 group-hover:text-primary">
                          View full size
                        </span>
                      </button>
                    ) : (
                      <p className="mt-1 text-xs text-base-content/55">
                        No screenshot on file (recorded without upload).
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {canAcknowledgeProofs &&
          needsFee &&
          !order.adminCommissionProofsAcknowledgedAt ? (
            <div className="space-y-2">
              <p className="text-xs text-base-content/70">
                After viewing the screenshots (or confirming legacy records),
                record your review to enable completing this order.
              </p>
              <button
                type="button"
                className="btn btn-outline btn-sm rounded-xl border-primary/30"
                disabled={loading !== null}
                onClick={() => setConfirmAction("ack")}
              >
                {loading === "ack" ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : null}
                Record proof review
              </button>
            </div>
          ) : null}

          {needsFee && order.adminCommissionProofsAcknowledgedAt ? (
            <p className="text-xs text-success">
              Review recorded{" "}
              {new Date(order.adminCommissionProofsAcknowledgedAt).toLocaleString()}
            </p>
          ) : null}

          {!gate.ok && canCompleteOrders ? (
            <p className="text-xs text-error" role="status">
              {gate.reason}
            </p>
          ) : null}

          {msg ? (
            <p className="text-xs text-error" role="alert">
              {msg}
            </p>
          ) : null}

          {canCompleteOrders && gate.ok ? (
            <button
              type="button"
              className="btn btn-primary btn-sm rounded-xl"
              disabled={loading !== null}
              onClick={() => setConfirmAction("complete")}
            >
              {loading === "complete" ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <HiOutlineCheckCircle className="h-4 w-4" />
              )}
              Mark order completed
            </button>
          ) : null}
        </div>
      </div>

      {imagePreview ? (
        <ImagePreviewLightbox
          open
          onClose={() => setImagePreview(null)}
          src={imagePreview.src}
          alt={imagePreview.alt}
        />
      ) : null}

      <ConfirmDialog
        open={confirmAction !== null}
        onOpenChange={(o) => !o && setConfirmAction(null)}
        title={
          confirmAction === "ack"
            ? "Record commission proof review?"
            : "Mark this order completed?"
        }
        description={
          confirmAction === "ack" ? (
            <>
              Confirm you have reviewed the uploaded commission receipts (or accepted
              legacy records). This unlocks the final completion step for this order.
            </>
          ) : (
            <>
              This closes the order as completed in the system. Buyers and suppliers
              will see it as finished — only continue if commissions are fully
              verified.
            </>
          )
        }
        variant={confirmAction === "complete" ? "primary" : "neutral"}
        confirmLabel={
          confirmAction === "ack" ? "Record review" : "Mark completed"
        }
        cancelLabel="Cancel"
        loading={
          confirmAction !== null && loading === confirmAction
        }
        onConfirm={async () => {
          if (confirmAction === "ack") await acknowledge();
          else if (confirmAction === "complete") await complete();
        }}
      />
    </section>
  );
}
