"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  HiOutlineBuildingOffice2,
  HiOutlineCheckCircle,
  HiOutlineClock,
} from "react-icons/hi2";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Company } from "@/lib/domain/types";
import { stripHtmlToPlainText } from "@/lib/rich-text";

type Props = { companies: Company[] };

export function AdminCompanyVerify({ companies }: Props) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [approveTarget, setApproveTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  async function setVerified(id: string, isVerified: boolean) {
    setMsg(null);
    setBusyId(id);
    const res = await fetch(`/api/companies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isVerified }),
    });
    const data = await res.json().catch(() => ({}));
    setBusyId(null);
    if (!res.ok) {
      setMsg(data.error ?? "Failed");
      return;
    }
    if (isVerified) setApproveTarget(null);
    router.refresh();
  }

  if (companies.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-base-300 bg-base-200/20 px-6 py-14 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-success">
          <HiOutlineCheckCircle className="h-8 w-8" />
        </span>
        <p className="mt-4 text-base font-medium text-base-content">
          Queue clear
        </p>
        <p className="mt-1 max-w-sm text-sm text-base-content/55">
          No suppliers are waiting for verification right now.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      {msg && (
        <p className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {msg}
        </p>
      )}
      <ul className="space-y-4">
        {companies.map((c) => (
          <li
            key={c.id}
            className="flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm ring-1 ring-base-300/20 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="flex min-w-0 flex-1 gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <HiOutlineBuildingOffice2 className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-semibold text-base-content">
                    {c.name}
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-medium text-warning">
                    <HiOutlineClock className="h-3.5 w-3.5" />
                    Pending
                  </span>
                </div>
                <p className="mt-1 font-mono text-xs text-base-content/45">
                  Owner {c.ownerId}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-base-content/70">
                  {stripHtmlToPlainText(c.description)}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">
              <button
                type="button"
                disabled={busyId === c.id}
                onClick={() => setApproveTarget({ id: c.id, name: c.name })}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-success px-4 py-2.5 text-sm font-semibold text-success-content shadow-sm transition hover:bg-success/90 disabled:opacity-50"
              >
                <HiOutlineCheckCircle className="h-5 w-5" />
                Approve
              </button>
              <button
                type="button"
                disabled={busyId === c.id}
                onClick={() => setVerified(c.id, false)}
                className="rounded-xl border border-base-300 bg-base-100 px-4 py-2.5 text-sm font-medium text-base-content transition hover:bg-base-200 disabled:opacity-50"
              >
                Keep pending
              </button>
            </div>
          </li>
        ))}
      </ul>
      <ConfirmDialog
        open={approveTarget !== null}
        onOpenChange={(o) => !o && setApproveTarget(null)}
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
        onConfirm={async () => {
          if (approveTarget) await setVerified(approveTarget.id, true);
        }}
      />
    </div>
  );
}
