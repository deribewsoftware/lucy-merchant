"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  HiOutlineFingerPrint,
  HiOutlineBuildingOffice2,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineShieldCheck,
  HiOutlinePhoto,
  HiOutlineUser,
  HiOutlineEnvelope,
  HiOutlineDocumentCheck,
} from "react-icons/hi2";
import type { Company } from "@/lib/domain/types";
import { stripHtmlToPlainText } from "@/lib/rich-text";

type PendingUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  nationalIdNumber?: string;
  nationalIdName?: string;
  nationalIdFrontImage?: string;
  nationalIdBackImage?: string;
  nationalIdSubmittedAt?: string;
};

type Tab = "identities" | "companies";

export function AdminVerificationsDashboard({
  pendingUsers,
  pendingCompanies,
  rejectedCompanies,
}: {
  pendingUsers: PendingUser[];
  pendingCompanies: Company[];
  rejectedCompanies: Company[];
}) {
  const [tab, setTab] = useState<Tab>("identities");

  return (
    <div className="mt-6">
      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-base-300 bg-base-200/40 p-1">
        <button
          type="button"
          onClick={() => setTab("identities")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
            tab === "identities"
              ? "bg-base-100 text-primary shadow-sm"
              : "text-base-content/55 hover:text-base-content/80"
          }`}
        >
          <HiOutlineFingerPrint className="h-4 w-4" />
          National IDs
          {pendingUsers.length > 0 && (
            <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-bold text-warning">
              {pendingUsers.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab("companies")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
            tab === "companies"
              ? "bg-base-100 text-primary shadow-sm"
              : "text-base-content/55 hover:text-base-content/80"
          }`}
        >
          <HiOutlineBuildingOffice2 className="h-4 w-4" />
          Companies
          {pendingCompanies.length > 0 && (
            <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-bold text-warning">
              {pendingCompanies.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="mt-6">
        {tab === "identities" ? (
          <IdentityVerificationList users={pendingUsers} />
        ) : (
          <CompanyVerificationList
            pending={pendingCompanies}
            rejected={rejectedCompanies}
          />
        )}
      </div>
    </div>
  );
}

/* ─── National ID Verification List ─── */

function IdentityVerificationList({ users }: { users: PendingUser[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function approve(userId: string) {
    setBusyId(userId);
    setMsg(null);
    const res = await fetch("/api/admin/verify-identity", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, approved: true }),
    });
    const data = await res.json().catch(() => ({}));
    setBusyId(null);
    if (!res.ok) {
      setMsg(data.error ?? "Failed to approve");
      return;
    }
    router.refresh();
  }

  async function reject(userId: string) {
    if (!reason.trim()) {
      setMsg("Please provide a rejection reason");
      return;
    }
    setBusyId(userId);
    setMsg(null);
    const res = await fetch("/api/admin/verify-identity", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, approved: false, reason: reason.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    setBusyId(null);
    if (!res.ok) {
      setMsg(data.error ?? "Failed to reject");
      return;
    }
    setRejectId(null);
    setReason("");
    router.refresh();
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-base-300 bg-base-200/20 px-6 py-14 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-success">
          <HiOutlineCheckCircle className="h-8 w-8" />
        </span>
        <p className="mt-4 text-base font-medium text-base-content">All clear</p>
        <p className="mt-1 max-w-sm text-sm text-base-content/55">
          No National ID verifications are waiting for review.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {msg && (
        <p className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {msg}
        </p>
      )}

      {users.map((u) => (
        <div
          key={u.id}
          className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm ring-1 ring-base-300/20"
        >
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-300 bg-base-200/25 px-5 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                <HiOutlineFingerPrint className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-base-content">{u.name}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-base-content/50">
                  <span className="inline-flex items-center gap-1">
                    <HiOutlineEnvelope className="h-3 w-3" /> {u.email}
                  </span>
                  <span className="rounded-full bg-base-200 px-2 py-0.5 font-medium capitalize">
                    {u.role}
                  </span>
                </div>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-medium text-warning">
              <HiOutlineClock className="h-3.5 w-3.5" />
              Pending
            </span>
          </div>

          {/* Details */}
          <div className="px-5 py-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-base-300/50 bg-base-200/20 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-base-content/40">
                  <HiOutlineFingerPrint className="mr-1 inline h-3 w-3" />
                  ID Number
                </p>
                <p className="mt-1 font-mono text-sm font-medium text-base-content">
                  {u.nationalIdNumber ?? "—"}
                </p>
              </div>
              <div className="rounded-xl border border-base-300/50 bg-base-200/20 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-base-content/40">
                  <HiOutlineUser className="mr-1 inline h-3 w-3" />
                  Name on ID
                </p>
                <p className="mt-1 text-sm font-medium text-base-content">
                  {u.nationalIdName ?? "—"}
                </p>
              </div>
            </div>

            {/* ID Images */}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-base-300/50 bg-base-200/20 p-3">
                <p className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-base-content/40">
                  <HiOutlinePhoto className="h-3 w-3" /> Front Side
                </p>
                {u.nationalIdFrontImage ? (
                  <a
                    href={u.nationalIdFrontImage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block overflow-hidden rounded-lg border border-base-300"
                  >
                    <img
                      src={u.nationalIdFrontImage}
                      alt="ID Front"
                      className="h-36 w-full object-cover transition hover:scale-105"
                    />
                  </a>
                ) : (
                  <div className="flex h-36 items-center justify-center rounded-lg border border-dashed border-base-300 text-xs text-base-content/40">
                    No image
                  </div>
                )}
              </div>
              <div className="rounded-xl border border-base-300/50 bg-base-200/20 p-3">
                <p className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-base-content/40">
                  <HiOutlinePhoto className="h-3 w-3" /> Back Side
                </p>
                {u.nationalIdBackImage ? (
                  <a
                    href={u.nationalIdBackImage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block overflow-hidden rounded-lg border border-base-300"
                  >
                    <img
                      src={u.nationalIdBackImage}
                      alt="ID Back"
                      className="h-36 w-full object-cover transition hover:scale-105"
                    />
                  </a>
                ) : (
                  <div className="flex h-36 items-center justify-center rounded-lg border border-dashed border-base-300 text-xs text-base-content/40">
                    No image
                  </div>
                )}
              </div>
            </div>

            {u.nationalIdSubmittedAt && (
              <p className="mt-3 text-xs text-base-content/40">
                Submitted {new Date(u.nationalIdSubmittedAt).toLocaleString()}
              </p>
            )}

            {/* Reject Modal */}
            {rejectId === u.id && (
              <div className="mt-4 rounded-xl border border-error/25 bg-error/5 p-4">
                <p className="text-sm font-semibold text-error">Rejection Reason</p>
                <p className="mt-1 text-xs text-base-content/55">
                  Explain why this verification is being declined. The user will see this.
                </p>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. ID image is blurry, name doesn't match..."
                  className="mt-2 w-full resize-y rounded-lg border border-error/25 bg-base-100 px-3 py-2 text-sm text-base-content outline-none transition placeholder:text-base-content/35 focus:border-error focus:ring-2 focus:ring-error/20"
                />
                <p className="mt-1 text-right text-xs text-base-content/40">
                  {reason.length} characters
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    disabled={busyId === u.id}
                    onClick={() => reject(u.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-error px-4 py-2 text-sm font-semibold text-error-content transition hover:bg-error/90 disabled:opacity-50"
                  >
                    <HiOutlineXCircle className="h-4 w-4" />
                    {busyId === u.id ? "Rejecting…" : "Confirm Rejection"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRejectId(null);
                      setReason("");
                    }}
                    className="rounded-lg border border-base-300 px-4 py-2 text-sm font-medium text-base-content transition hover:bg-base-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {rejectId !== u.id && (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busyId === u.id}
                  onClick={() => approve(u.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-success px-5 py-2.5 text-sm font-semibold text-success-content shadow-sm transition hover:bg-success/90 disabled:opacity-50"
                >
                  <HiOutlineShieldCheck className="h-5 w-5" />
                  {busyId === u.id ? "Approving…" : "Approve"}
                </button>
                <button
                  type="button"
                  disabled={busyId === u.id}
                  onClick={() => {
                    setRejectId(u.id);
                    setReason("");
                    setMsg(null);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-error/30 bg-base-100 px-5 py-2.5 text-sm font-semibold text-error transition hover:bg-error/10 disabled:opacity-50"
                >
                  <HiOutlineXCircle className="h-5 w-5" />
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Company Verification List ─── */

function CompanyVerificationList({
  pending,
  rejected,
}: {
  pending: Company[];
  rejected: Company[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function approve(companyId: string) {
    setBusyId(companyId);
    setMsg(null);
    const res = await fetch(`/api/companies/${companyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isVerified: true }),
    });
    const data = await res.json().catch(() => ({}));
    setBusyId(null);
    if (!res.ok) {
      setMsg(data.error ?? "Failed");
      return;
    }
    router.refresh();
  }

  async function reject(companyId: string) {
    if (!reason.trim()) {
      setMsg("Please provide a rejection reason");
      return;
    }
    setBusyId(companyId);
    setMsg(null);
    const res = await fetch(`/api/companies/${companyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isVerified: false,
        rejectionReason: reason.trim(),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusyId(null);
    if (!res.ok) {
      setMsg(data.error ?? "Failed");
      return;
    }
    setRejectId(null);
    setReason("");
    router.refresh();
  }

  const allEmpty = pending.length === 0 && rejected.length === 0;

  if (allEmpty) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-base-300 bg-base-200/20 px-6 py-14 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-success">
          <HiOutlineCheckCircle className="h-8 w-8" />
        </span>
        <p className="mt-4 text-base font-medium text-base-content">Queue clear</p>
        <p className="mt-1 max-w-sm text-sm text-base-content/55">
          No companies are waiting for verification right now.
        </p>
      </div>
    );
  }

  function renderCompanyCard(c: Company, isRejected: boolean) {
    return (
      <div
        key={c.id}
        className={`overflow-hidden rounded-2xl border shadow-sm ring-1 ring-base-300/20 ${
          isRejected
            ? "border-error/25 bg-base-100"
            : "border-base-300 bg-base-100"
        }`}
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-300 bg-base-200/25 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
              <HiOutlineBuildingOffice2 className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-base-content">{c.name}</p>
              <p className="mt-0.5 text-xs text-base-content/45">
                Owner <span className="font-mono">{c.ownerId.slice(0, 12)}…</span>
              </p>
            </div>
          </div>
          {isRejected ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-error/15 px-2.5 py-0.5 text-xs font-medium text-error">
              <HiOutlineXCircle className="h-3.5 w-3.5" />
              Rejected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-medium text-warning">
              <HiOutlineClock className="h-3.5 w-3.5" />
              Pending
            </span>
          )}
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <p className="text-sm leading-relaxed text-base-content/70">
            {stripHtmlToPlainText(c.description)}
          </p>

          {/* TIN & Trade License */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-base-300/50 bg-base-200/20 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-base-content/40">
                <HiOutlineFingerPrint className="mr-1 inline h-3 w-3" />
                TIN Number
              </p>
              <p className="mt-1 font-mono text-sm font-medium text-base-content">
                {c.tinNumber || <span className="text-base-content/30">Not provided</span>}
              </p>
            </div>
            <div className="rounded-xl border border-base-300/50 bg-base-200/20 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-base-content/40">
                <HiOutlineDocumentCheck className="mr-1 inline h-3 w-3" />
                Trade License
              </p>
              <p className="mt-1 text-sm font-medium text-base-content">
                {c.tradeLicenseNumber || (
                  <span className="text-base-content/30">Not provided</span>
                )}
              </p>
            </div>
          </div>

          {c.tradeLicenseDocument && (
            <div className="mt-3">
              <a
                href={c.tradeLicenseDocument}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary underline-offset-2 hover:underline"
              >
                <HiOutlineDocumentCheck className="h-3.5 w-3.5" />
                View Trade License Document
              </a>
            </div>
          )}

          {c.businessAddress && (
            <p className="mt-3 text-sm text-base-content/55">
              <span className="font-medium text-base-content/70">Location: </span>
              {c.businessAddress}
            </p>
          )}

          {isRejected && c.rejectionReason && (
            <div className="mt-4 rounded-xl border border-error/20 bg-error/5 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-error/70">
                Rejection Reason
              </p>
              <p className="mt-1 text-sm text-base-content/80">{c.rejectionReason}</p>
              {c.reviewedAt && (
                <p className="mt-2 text-xs text-base-content/40">
                  Rejected on {new Date(c.reviewedAt).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Reject modal */}
          {rejectId === c.id && (
            <div className="mt-4 rounded-xl border border-error/25 bg-error/5 p-4">
              <p className="text-sm font-semibold text-error">Rejection Reason</p>
              <p className="mt-1 text-xs text-base-content/55">
                This reason will be shared with the supplier.
              </p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="e.g. TIN number is invalid, trade license expired..."
                className="mt-2 w-full resize-y rounded-lg border border-error/25 bg-base-100 px-3 py-2 text-sm text-base-content outline-none transition placeholder:text-base-content/35 focus:border-error focus:ring-2 focus:ring-error/20"
              />
              <p className="mt-1 text-right text-xs text-base-content/40">
                {reason.length} characters
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={busyId === c.id}
                  onClick={() => reject(c.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-error px-4 py-2 text-sm font-semibold text-error-content transition hover:bg-error/90 disabled:opacity-50"
                >
                  <HiOutlineXCircle className="h-4 w-4" />
                  {busyId === c.id ? "Rejecting…" : "Confirm Rejection"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRejectId(null);
                    setReason("");
                  }}
                  className="rounded-lg border border-base-300 px-4 py-2 text-sm font-medium text-base-content transition hover:bg-base-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Actions for pending */}
          {!isRejected && rejectId !== c.id && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busyId === c.id}
                onClick={() => approve(c.id)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-success px-5 py-2.5 text-sm font-semibold text-success-content shadow-sm transition hover:bg-success/90 disabled:opacity-50"
              >
                <HiOutlineShieldCheck className="h-5 w-5" />
                {busyId === c.id ? "Approving…" : "Approve"}
              </button>
              <button
                type="button"
                disabled={busyId === c.id}
                onClick={() => {
                  setRejectId(c.id);
                  setReason("");
                  setMsg(null);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-error/30 bg-base-100 px-5 py-2.5 text-sm font-semibold text-error transition hover:bg-error/10 disabled:opacity-50"
              >
                <HiOutlineXCircle className="h-5 w-5" />
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {msg && (
        <p className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {msg}
        </p>
      )}

      {pending.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-base-content/50">
            Pending Verification ({pending.length})
          </h3>
          {pending.map((c) => renderCompanyCard(c, false))}
        </div>
      )}

      {rejected.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-error/70">
            Previously Rejected ({rejected.length})
          </h3>
          {rejected.map((c) => renderCompanyCard(c, true))}
        </div>
      )}
    </div>
  );
}
