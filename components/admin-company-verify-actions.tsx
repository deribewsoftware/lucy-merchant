"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { HiOutlineCheckCircle, HiOutlineXCircle } from "react-icons/hi2";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Props = {
  companyId: string;
  companyName: string;
  /** When false, buttons are hidden (e.g. already verified). */
  showVerificationActions: boolean;
  className?: string;
};

export function AdminCompanyVerifyActions({
  companyId,
  companyName,
  showVerificationActions,
  className,
}: Props) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [approveTarget, setApproveTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  async function submitApprove(id: string) {
    setMsg(null);
    setBusyId(id);
    const res = await fetch(`/api/companies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isVerified: true }),
    });
    const data = await res.json().catch(() => ({}));
    setBusyId(null);
    if (!res.ok) {
      setMsg(typeof data.error === "string" ? data.error : "Failed");
      return;
    }
    setMsg(null);
    setApproveTarget(null);
    router.refresh();
  }

  async function submitReject() {
    const r = rejectReason.trim();
    if (!r) {
      setMsg("Enter a rejection reason — suppliers see this message.");
      return;
    }
    setMsg(null);
    setBusyId(companyId);
    const res = await fetch(`/api/companies/${companyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isVerified: false,
        rejectionReason: r,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusyId(null);
    if (!res.ok) {
      setMsg(typeof data.error === "string" ? data.error : "Failed");
      return;
    }
    setRejectOpen(false);
    setRejectReason("");
    router.refresh();
  }

  if (!showVerificationActions) {
    return null;
  }

  return (
    <div className={className}>
      <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">
        <button
          type="button"
          disabled={busyId === companyId}
          onClick={() => {
            setMsg(null);
            setApproveTarget({ id: companyId, name: companyName });
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-success px-4 py-2.5 text-sm font-semibold text-success-content shadow-sm transition hover:bg-success/90 disabled:opacity-50"
        >
          <HiOutlineCheckCircle className="h-5 w-5" />
          Approve
        </button>
        <button
          type="button"
          disabled={busyId === companyId}
          onClick={() => {
            setMsg(null);
            setRejectReason("");
            setRejectOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-error/35 bg-base-100 px-4 py-2.5 text-sm font-semibold text-error transition hover:bg-error/10 disabled:opacity-50"
        >
          <HiOutlineXCircle className="h-5 w-5" />
          Reject
        </button>
      </div>
      <ConfirmDialog
        open={approveTarget !== null}
        onOpenChange={(o) => {
          if (!o) setApproveTarget(null);
        }}
        title={
          approveTarget
            ? `Approve “${approveTarget.name}”?`
            : "Approve company?"
        }
        description="This publishes the company as verified so the owner can list products. Make sure documents and details have been checked."
        variant="primary"
        confirmLabel="Approve company"
        cancelLabel="Review again"
        loading={
          approveTarget !== null && busyId === approveTarget.id
        }
        errorMessage={approveTarget !== null ? msg : null}
        onConfirm={async () => {
          if (approveTarget) await submitApprove(approveTarget.id);
        }}
      />
      <ConfirmDialog
        open={rejectOpen}
        onOpenChange={(o) => {
          if (!o) {
            setRejectOpen(false);
            setRejectReason("");
            setMsg(null);
          }
        }}
        title={`Reject “${companyName}”?`}
        description="The supplier will see this reason and can update their profile before resubmitting."
        variant="danger"
        confirmLabel="Reject company"
        cancelLabel="Cancel"
        loading={busyId === companyId}
        errorMessage={rejectOpen ? msg : null}
        onConfirm={async () => {
          await submitReject();
        }}
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
            Reason (required)
          </span>
          <textarea
            value={rejectReason}
            onChange={(e) => {
              setRejectReason(e.target.value);
              if (msg) setMsg(null);
            }}
            rows={4}
            className="textarea textarea-bordered w-full min-h-[6.5rem] resize-y text-sm text-base-content"
            placeholder="e.g. Trade license scan is unreadable — please upload a clearer PDF."
            autoComplete="off"
          />
          <span className="text-right text-xs text-base-content/40">
            {rejectReason.trim().length} characters
          </span>
        </label>
      </ConfirmDialog>
    </div>
  );
}
