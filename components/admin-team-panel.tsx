"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  HiOutlineChevronDown,
  HiOutlineEnvelope,
  HiOutlineFunnel,
  HiOutlineKey,
  HiOutlineMagnifyingGlass,
  HiOutlineTrash,
  HiOutlineUserPlus,
  HiOutlineUsers,
  HiOutlineXMark,
} from "react-icons/hi2";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ADMIN_INVITE_DEFAULT_PASSWORD } from "@/lib/auth/admin-invite";
import { STAFF_PERMISSION_LABELS } from "@/lib/admin-permission-labels";
import type { Permission, UserRole } from "@/lib/domain/types";

type Member = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  /** False only when email is explicitly unverified (e.g. invited admin). */
  emailVerified: boolean;
  adminPermissionDeny: Permission[];
  adminPermissionAllow: Permission[] | null;
  permissionMode: "allow" | "deny";
  effectivePermissions: Permission[];
  createdAt: string;
};

function selectedPermissionsForUi(m: Member): Permission[] {
  if (m.role === "system_admin") return [];
  if (m.adminPermissionAllow !== null && m.adminPermissionAllow !== undefined) {
    return [...m.adminPermissionAllow];
  }
  return [...(m.effectivePermissions ?? [])];
}

function matchesSearch(m: Member, q: string): boolean {
  if (!q.trim()) return true;
  const s = q.trim().toLowerCase();
  const roleLabel =
    m.role === "system_admin" ? "system administrator" : "administrator";
  return (
    m.name.toLowerCase().includes(s) ||
    m.email.toLowerCase().includes(s) ||
    roleLabel.includes(s)
  );
}

export function AdminTeamPanel() {
  const [members, setMembers] = useState<Member[]>([]);
  const [assignable, setAssignable] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [inviteEmailWarning, setInviteEmailWarning] = useState<string | null>(null);
  const [inviteEmailDetail, setInviteEmailDetail] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [invitePassword, setInvitePassword] = useState(ADMIN_INVITE_DEFAULT_PASSWORD);
  const [inviting, setInviting] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [viewerRole, setViewerRole] = useState<UserRole | null>(null);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<Member | null>(null);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revokeLoading, setRevokeLoading] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  const [staffQuery, setStaffQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "system_admin">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /** Draft permission sets for administrators (explicit Save). */
  const [draftAllow, setDraftAllow] = useState<Record<string, Permission[]>>({});
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  /** From /api/health/email — invite emails require SMTP env on the server. */
  const [smtpConfigured, setSmtpConfigured] = useState<boolean | null>(null);
  const [testSmtpLoading, setTestSmtpLoading] = useState(false);
  const [testSmtpMessage, setTestSmtpMessage] = useState<string | null>(null);

  const groupedAssignable = useMemo(() => {
    const groups = new Map<string, Permission[]>();
    for (const p of assignable) {
      const g = STAFF_PERMISSION_LABELS[p]?.group ?? "Other";
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g)!.push(p);
    }
    const order = [
      "Core",
      "Operations",
      "Catalog",
      "Orders",
      "Trust & safety",
      "Platform",
      "Other",
    ];
    return [...groups.entries()].sort(
      (a, b) => order.indexOf(a[0]) - order.indexOf(b[0]) || a[0].localeCompare(b[0]),
    );
  }, [assignable]);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (!matchesSearch(m, staffQuery)) return false;
      if (roleFilter === "all") return true;
      return m.role === roleFilter;
    });
  }, [members, staffQuery, roleFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [res, healthRes] = await Promise.all([
      fetch("/api/admin/team"),
      fetch("/api/health/email", { cache: "no-store" }),
    ]);
    const healthData = await healthRes.json().catch(() => ({}));
    const configured =
      Boolean(healthData?.email?.configured) ||
      Boolean(healthData?.nodemailer?.configured);
    setSmtpConfigured(configured);
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not load team");
      return;
    }
    const list = (data.members ?? []) as Member[];
    setMembers(list);
    setAssignable(data.assignablePermissions ?? []);
    setViewerRole((data.viewerRole as UserRole | undefined) ?? null);
    setViewerId(typeof data.viewerId === "string" ? data.viewerId : null);
    const drafts: Record<string, Permission[]> = {};
    for (const m of list) {
      if (m.role === "admin") drafts[m.id] = selectedPermissionsForUi(m);
    }
    setDraftAllow(drafts);
    setDirty({});
    setExpandedId(null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!expandedId) return;
    if (!filteredMembers.some((x) => x.id === expandedId)) {
      setExpandedId(null);
    }
  }, [filteredMembers, expandedId]);

  function draftFor(m: Member): Permission[] {
    if (m.role !== "admin") return [];
    return draftAllow[m.id] ?? selectedPermissionsForUi(m);
  }

  function isDirty(m: Member): boolean {
    return m.role === "admin" && Boolean(dirty[m.id]);
  }

  async function savePermissions(m: Member) {
    if (m.role !== "admin") return;
    const allow = draftFor(m);
    setSavingId(m.id);
    setError(null);
    const body: Record<string, unknown> = {
      userId: m.id,
      role: m.role,
      adminPermissionAllow: allow,
    };
    const res = await fetch("/api/admin/team", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setSavingId(null);
    if (!res.ok) {
      setError(data.error ?? "Save failed");
      return;
    }
    if (data.member) {
      const mem = data.member as Member;
      setMembers((prev) => prev.map((x) => (x.id === m.id ? { ...x, ...mem } : x)));
      setDraftAllow((prev) => ({
        ...prev,
        [m.id]: selectedPermissionsForUi({ ...m, ...mem }),
      }));
      setDirty((prev) => ({ ...prev, [m.id]: false }));
    }
  }

  function discardDraft(m: Member) {
    if (m.role !== "admin") return;
    setDraftAllow((prev) => ({
      ...prev,
      [m.id]: selectedPermissionsForUi(m),
    }));
    setDirty((prev) => ({ ...prev, [m.id]: false }));
  }

  function toggleDraftPermission(m: Member, p: Permission, checked: boolean) {
    if (m.role !== "admin") return;
    const cur = new Set(draftFor(m));
    if (checked) cur.add(p);
    else cur.delete(p);
    const next = [...cur];
    setDraftAllow((prev) => ({ ...prev, [m.id]: next }));
    const server = selectedPermissionsForUi(m);
    const same =
      next.length === server.length &&
      next.every((x) => server.includes(x)) &&
      server.every((x) => next.includes(x));
    setDirty((prev) => ({ ...prev, [m.id]: !same }));
  }

  async function saveRole(m: Member, nextRole: UserRole) {
    setSavingId(m.id);
    setError(null);
    const body: Record<string, unknown> = {
      userId: m.id,
      role: nextRole,
    };
    if (nextRole === "admin") {
      body.adminPermissionAllow =
        m.role === "system_admin" ? [] : draftFor(m);
    }
    const res = await fetch("/api/admin/team", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setSavingId(null);
    if (!res.ok) {
      setError(data.error ?? "Update failed");
      return;
    }
    if (data.member) {
      const mem = data.member as Member;
      setMembers((prev) => prev.map((x) => (x.id === m.id ? { ...x, ...mem } : x)));
      if (mem.role === "admin") {
        setDraftAllow((prev) => ({
          ...prev,
          [m.id]: selectedPermissionsForUi(mem),
        }));
        setDirty((prev) => ({ ...prev, [m.id]: false }));
      } else {
        setDraftAllow((prev) => {
          const next = { ...prev };
          delete next[m.id];
          return next;
        });
        setDirty((prev) => {
          const next = { ...prev };
          delete next[m.id];
          return next;
        });
      }
    }
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setError(null);
    setInviteSuccess(null);
    setInviteEmailWarning(null);
    setInviteEmailDetail(null);
    const res = await fetch("/api/admin/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: inviteEmail.trim(),
        name: inviteName.trim() || undefined,
        password: invitePassword || ADMIN_INVITE_DEFAULT_PASSWORD,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setInviting(false);
    if (!res.ok) {
      setError(data.error ?? "Invite failed");
      return;
    }
    setInviteEmail("");
    setInviteName("");
    setInvitePassword(ADMIN_INVITE_DEFAULT_PASSWORD);
    if (data.member) {
      setMembers((prev) => [...prev, data.member]);
    }
    void load();
    setInviteSuccess(
      "Administrator created. They can sign in with the email and password you set (also sent by email when SMTP works). They start with no permissions until you grant them below.",
    );
    if (typeof data.nodemailerConfigured === "boolean") {
      setSmtpConfigured(data.nodemailerConfigured);
    }
    if (!data.emailSent) {
      const msg =
        typeof data.emailDeliveryError === "string"
          ? data.emailDeliveryError
          : "Credentials email was not sent. Check server email configuration or share the password manually.";
      setInviteEmailWarning(msg);
      setInviteEmailDetail(
        typeof data.emailDeliveryDetail === "string" ? data.emailDeliveryDetail : null,
      );
    } else {
      setInviteEmailWarning(null);
      setInviteEmailDetail(null);
    }
  }

  async function resendVerificationEmail(m: Member) {
    setResendingId(m.id);
    setError(null);
    const res = await fetch("/api/admin/team/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: m.id }),
    });
    const data = await res.json().catch(() => ({}));
    setResendingId(null);
    if (!res.ok) {
      const base =
        typeof data.error === "string"
          ? data.error
          : "Could not send credentials email";
      const detail = typeof data.detail === "string" ? data.detail : null;
      setError(detail ? `${base} (${detail})` : base);
      return;
    }
    setInviteSuccess(
      `Credentials email sent to ${m.email}. Their password was reset to the default (${ADMIN_INVITE_DEFAULT_PASSWORD}) — they must change it after sign-in.`,
    );
    setInviteEmailWarning(null);
    setInviteEmailDetail(null);
    void load();
  }

  const canRevokeStaff =
    viewerRole === "system_admin" && Boolean(viewerId);

  async function sendTestSmtp() {
    setTestSmtpLoading(true);
    setTestSmtpMessage(null);
    setError(null);
    const res = await fetch("/api/admin/team/test-smtp", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setTestSmtpLoading(false);
    if (!res.ok) {
      const base =
        typeof data.error === "string" ? data.error : "SMTP test failed";
      const detail = typeof data.detail === "string" ? data.detail : null;
      setError(detail ? `${base} (${detail})` : base);
      return;
    }
    const to = typeof data.sentTo === "string" ? data.sentTo : "your inbox";
    setTestSmtpMessage(`Test email sent to ${to}. Check spam if it does not arrive.`);
  }

  async function confirmRevokeStaff() {
    if (!revokeTarget) return;
    setRevokeLoading(true);
    setRevokeError(null);
    const res = await fetch("/api/admin/team", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: revokeTarget.id }),
    });
    const data = await res.json().catch(() => ({}));
    setRevokeLoading(false);
    if (!res.ok) {
      setRevokeError(
        typeof data.error === "string" ? data.error : "Could not revoke access",
      );
      return;
    }
    setMembers((prev) => prev.filter((x) => x.id !== revokeTarget.id));
    setDraftAllow((prev) => {
      const next = { ...prev };
      delete next[revokeTarget.id];
      return next;
    });
    setDirty((prev) => {
      const next = { ...prev };
      delete next[revokeTarget.id];
      return next;
    });
    if (expandedId === revokeTarget.id) setExpandedId(null);
    setRevokeOpen(false);
    setRevokeTarget(null);
    setInviteSuccess(
      `Removed staff access for ${revokeTarget.email}. They can still sign in as a merchant.`,
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-base-300/60 bg-base-200/20 px-6 py-10">
        <span className="loading loading-spinner loading-md text-primary" />
        <p className="text-sm text-base-content/70">Loading team…</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {smtpConfigured === false && !loading ? (
        <div className="rounded-2xl border-2 border-error/35 bg-error/10 px-4 py-4 text-sm text-base-content sm:px-5">
          <p className="font-semibold text-error">Invite emails are not being sent</p>
          <p className="mt-2 leading-relaxed text-base-content/90">
            The server has no SMTP credentials. Set{" "}
            <code className="rounded bg-base-200 px-1.5 py-0.5 font-mono text-xs">
              NODEMAILER_FROM_EMAIL
            </code>{" "}
            and{" "}
            <code className="rounded bg-base-200 px-1.5 py-0.5 font-mono text-xs">
              NODEMAILER_PASSWORD
            </code>{" "}
            (e.g. Gmail <strong className="font-medium">app password</strong>) in your deployment
            environment, then redeploy or restart. Optional:{" "}
            <code className="rounded bg-base-200 px-1 font-mono text-xs">NODEMAILER_USER</code>,{" "}
            <code className="rounded bg-base-200 px-1 font-mono text-xs">NODEMAILER_PORT</code> (465
            or 587).
          </p>
          <p className="mt-2 text-xs text-base-content/75">
            Set{" "}
            <code className="rounded bg-base-200 px-1 font-mono text-[11px]">
              NEXT_PUBLIC_APP_URL
            </code>{" "}
            to your real site URL so links inside emails point to production.
          </p>
          <p className="mt-3 text-xs text-base-content/65">
            Check status:{" "}
            <a className="link link-primary font-medium" href="/api/health/email" target="_blank" rel="noreferrer">
              /api/health/email
            </a>
          </p>
        </div>
      ) : null}

      {viewerRole === "system_admin" && smtpConfigured === true ? (
        <div className="space-y-2 rounded-2xl border border-base-300/60 bg-base-200/25 px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-base-content/80">
              Outbound email looks configured. Send a test message to your login email to confirm delivery
              after deploy.
            </p>
            <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
              <a
                className="link link-primary text-sm font-medium"
                href="/api/health/email"
                target="_blank"
                rel="noreferrer"
              >
                Email health
              </a>
              <button
                type="button"
                className="btn btn-primary btn-sm gap-1"
                disabled={testSmtpLoading}
                onClick={() => void sendTestSmtp()}
              >
                {testSmtpLoading ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : null}
                Send test email to me
              </button>
            </div>
          </div>
          {testSmtpMessage ? (
            <p className="text-xs font-medium text-success">{testSmtpMessage}</p>
          ) : null}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-base-300/80 bg-base-100 shadow-sm">
        <div className="border-b border-base-300/60 bg-gradient-to-r from-primary/5 to-transparent px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <HiOutlineUserPlus className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-base-content">Invite administrator</h2>
              <p className="text-sm text-base-content/65">
                Sends one email with their work email, password, and a link to the login page (when SMTP is
                configured). They sign in directly — no verification code. If you leave the default password (
                {ADMIN_INVITE_DEFAULT_PASSWORD}), they must set a new password before using admin tools.
              </p>
            </div>
          </div>
        </div>
        <form
          onSubmit={invite}
          className="grid gap-4 p-5 sm:p-6 sm:grid-cols-[1fr_1fr_minmax(0,12rem)_auto] sm:items-end"
        >
          <label className="form-control w-full">
            <span className="label-text text-xs font-medium text-base-content/70">Work email</span>
            <input
              type="email"
              required
              className="input input-bordered input-sm w-full"
              value={inviteEmail}
              onChange={(ev) => setInviteEmail(ev.target.value)}
              placeholder="name@organization.com"
              autoComplete="off"
            />
          </label>
          <label className="form-control w-full">
            <span className="label-text text-xs font-medium text-base-content/70">Display name (optional)</span>
            <input
              type="text"
              className="input input-bordered input-sm w-full"
              value={inviteName}
              onChange={(ev) => setInviteName(ev.target.value)}
              placeholder="Full name"
            />
          </label>
          <label className="form-control w-full">
            <span className="label-text text-xs font-medium text-base-content/70">Initial password</span>
            <input
              type="text"
              className="input input-bordered input-sm w-full font-mono"
              value={invitePassword}
              onChange={(ev) => setInvitePassword(ev.target.value)}
            />
          </label>
          <button
            type="submit"
            className="btn btn-primary btn-sm sm:min-h-[2.5rem]"
            disabled={inviting}
          >
            {inviting ? <span className="loading loading-spinner loading-xs" /> : null}
            Send invite
          </button>
        </form>
      </section>

      {error ? (
        <div className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      ) : null}
      {inviteSuccess ? (
        <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          {inviteSuccess}
        </div>
      ) : null}
      {inviteEmailWarning ? (
        <div className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-base-content">
          <p className="font-semibold text-warning">Credentials email was not sent</p>
          <p className="mt-1 text-base-content/90">{inviteEmailWarning}</p>
          {inviteEmailDetail ? (
            <pre className="mt-2 max-h-28 overflow-auto rounded-lg bg-base-100/90 p-2 font-mono text-[11px] leading-snug text-base-content/80">
              {inviteEmailDetail}
            </pre>
          ) : null}
          <p className="mt-2 text-xs text-base-content/65">
            After fixing SMTP, use <strong className="text-base-content">Resend credentials</strong> on their row
            (resets to default password {ADMIN_INVITE_DEFAULT_PASSWORD} and emails it), or share the password from the
            invite form manually.
          </p>
        </div>
      ) : null}

      <div className="rounded-xl border border-base-300/60 bg-base-200/15 px-4 py-3 text-sm text-base-content/75">
        <p className="flex flex-wrap items-center gap-2">
          <HiOutlineEnvelope className="h-4 w-4 shrink-0 text-primary" />
          <span>
            <strong className="text-base-content">Access requests:</strong> admins with no
            permissions can alert all system administrators (throttled to once per 24 hours).
            Use <strong className="text-base-content">Save changes</strong> below to apply
            permission updates — they receive in-app and email notifications when you save.
          </span>
        </p>
        <p className="mt-2 flex flex-wrap items-center gap-2 border-t border-base-300/40 pt-2">
          <HiOutlineKey className="h-4 w-4 shrink-0 text-accent" />
          <span>
            Legacy deny-only accounts show effective permissions in the editor; saving writes an
            explicit whitelist.
          </span>
        </p>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-2">
            <HiOutlineUsers className="h-5 w-5 text-base-content/50" />
            <div>
              <h2 className="text-lg font-semibold text-base-content">Staff members</h2>
              <p className="text-sm text-base-content/55">
                Search and filter, then expand a row to edit permissions. Changes apply when you
                click Save.
              </p>
            </div>
          </div>
          <p className="text-sm text-base-content/50">
            Showing{" "}
            <span className="font-semibold text-base-content">{filteredMembers.length}</span> of{" "}
            {members.length}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <label className="input input-bordered input-sm flex min-h-10 min-w-0 flex-1 items-center gap-2 border-base-300 bg-base-100 sm:max-w-md">
            <HiOutlineMagnifyingGlass className="h-4 w-4 shrink-0 opacity-50" />
            <input
              type="search"
              className="grow bg-transparent text-sm outline-none placeholder:text-base-content/40"
              placeholder="Search by name, email, or role…"
              value={staffQuery}
              onChange={(e) => setStaffQuery(e.target.value)}
              autoComplete="off"
            />
            {staffQuery ? (
              <button
                type="button"
                className="btn btn-ghost btn-xs btn-square shrink-0"
                aria-label="Clear search"
                onClick={() => setStaffQuery("")}
              >
                <HiOutlineXMark className="h-4 w-4" />
              </button>
            ) : null}
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-base-content/45">
              <HiOutlineFunnel className="h-3.5 w-3.5" />
              Role
            </span>
            {(
              [
                ["all", "All"],
                ["admin", "Administrator"],
                ["system_admin", "System admin"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`btn btn-xs rounded-full ${
                  roleFilter === value
                    ? "btn-primary"
                    : "btn-ghost border border-base-300/80"
                }`}
                onClick={() => setRoleFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-base-300/80 bg-base-100 shadow-sm">
          <div className="hidden border-b border-base-300/70 bg-base-200/40 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-base-content/50 md:grid md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_auto_auto_auto] md:gap-3 md:px-5">
            <span>Member</span>
            <span>Email</span>
            <span className="text-center">Role</span>
            <span className="text-center">Access</span>
            <span className="text-right">Manage</span>
          </div>

          <ul className="divide-y divide-base-300/60">
            {filteredMembers.length === 0 ? (
              <li className="px-4 py-12 text-center text-sm text-base-content/55">
                No staff match your search. Try another term or reset filters.
              </li>
            ) : (
              filteredMembers.map((m) => {
                const capCount =
                  m.role === "system_admin"
                    ? "Full"
                    : `${draftFor(m).length} / ${assignable.length}`;
                const expanded = expandedId === m.id;
                return (
                  <li key={m.id} className="bg-base-100">
                    <div className="flex flex-col gap-3 px-4 py-4 md:grid md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_auto_auto_auto] md:items-center md:gap-3 md:px-5">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                            m.role === "system_admin"
                              ? "bg-primary/15 text-primary"
                              : "bg-base-300/50 text-base-content/80"
                          }`}
                          aria-hidden
                        >
                          {m.name
                            .split(/\s+/)
                            .map((w) => w[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-base-content">{m.name}</p>
                          <p className="text-xs text-base-content/45 md:hidden">
                            Joined {new Date(m.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="min-w-0 md:py-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm text-base-content/70">{m.email}</p>
                          {!m.emailVerified ? (
                            <span className="badge badge-warning badge-xs whitespace-nowrap">
                              Legacy — email not verified
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <p className="hidden text-xs text-base-content/40 md:block">
                            Joined {new Date(m.createdAt).toLocaleDateString()}
                          </p>
                          {!m.emailVerified ? (
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs gap-1 text-primary"
                              disabled={resendingId === m.id}
                              onClick={() => void resendVerificationEmail(m)}
                            >
                              {resendingId === m.id ? (
                                <span className="loading loading-spinner loading-xs" />
                              ) : (
                                <HiOutlineEnvelope className="h-3.5 w-3.5" />
                              )}
                              Resend credentials
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex justify-start md:justify-center">
                        <span
                          className={`badge badge-sm whitespace-nowrap ${
                            m.role === "system_admin"
                              ? "badge-primary"
                              : "badge-ghost border border-base-300"
                          }`}
                        >
                          {m.role === "system_admin" ? "System" : "Admin"}
                        </span>
                      </div>
                      <div className="flex justify-start md:justify-center">
                        <span
                          className={`badge badge-sm badge-outline font-mono text-xs ${
                            m.role === "system_admin" ? "border-primary/30" : ""
                          }`}
                        >
                          {capCount}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          className={`btn btn-sm gap-1 ${
                            expanded ? "btn-primary" : "btn-ghost border border-base-300/80"
                          }`}
                          disabled={savingId === m.id}
                          onClick={() =>
                            setExpandedId((id) => (id === m.id ? null : m.id))
                          }
                        >
                          {m.role === "admin" ? (
                            <>
                              Permissions
                              <HiOutlineChevronDown
                                className={`h-4 w-4 transition-transform ${
                                  expanded ? "rotate-180" : ""
                                }`}
                              />
                            </>
                          ) : (
                            "Details"
                          )}
                        </button>
                      </div>
                    </div>

                    {expanded ? (
                      <div className="border-t border-base-300/60 bg-base-200/25 px-4 py-5 sm:px-6">
                        <div className="mx-auto max-w-4xl space-y-5">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm font-medium text-base-content">
                                Role assignment
                              </p>
                              <p className="text-xs text-base-content/55">
                                System administrators have full access; administrators use the
                                checklist below.
                              </p>
                            </div>
                            <select
                              className="select select-bordered select-sm w-full max-w-xs sm:w-auto"
                              value={m.role}
                              disabled={savingId === m.id}
                              onChange={(e) => {
                                const next = e.target.value as UserRole;
                                void saveRole(m, next);
                                if (next === "system_admin") setExpandedId(null);
                              }}
                            >
                              <option value="admin">Administrator</option>
                              <option value="system_admin">System administrator</option>
                            </select>
                          </div>

                          {m.role === "system_admin" ? (
                            <p className="rounded-xl border border-base-300/60 bg-base-100 px-4 py-3 text-sm text-base-content/70">
                              Full access to the admin workspace, including Team &amp; roles and
                              the audit log. No permission checklist applies.
                            </p>
                          ) : (
                            <>
                              {m.permissionMode === "deny" ? (
                                <p className="rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning-content">
                                  Legacy deny-list — editor shows effective access. Saving applies
                                  a new whitelist.
                                </p>
                              ) : null}

                              <div className="space-y-5">
                                {groupedAssignable.map(([group, perms]) => (
                                  <div key={group}>
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-base-content/45">
                                      {group}
                                    </p>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                      {perms.map((p) => {
                                        const meta = STAFF_PERMISSION_LABELS[p];
                                        const checked = new Set(draftFor(m)).has(p);
                                        return (
                                          <label
                                            key={p}
                                            className={`flex cursor-pointer gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                                              checked
                                                ? "border-primary/40 bg-primary/5"
                                                : "border-base-300/80 bg-base-100 hover:border-base-300"
                                            }`}
                                          >
                                            <input
                                              type="checkbox"
                                              className="checkbox checkbox-sm checkbox-primary mt-0.5 shrink-0"
                                              checked={checked}
                                              disabled={savingId === m.id}
                                              onChange={(e) =>
                                                toggleDraftPermission(m, p, e.target.checked)
                                              }
                                            />
                                            <span className="min-w-0">
                                              <span className="block text-sm font-medium text-base-content">
                                                {meta?.title ?? p}
                                              </span>
                                              {meta?.description ? (
                                                <span className="mt-0.5 block text-xs text-base-content/55">
                                                  {meta.description}
                                                </span>
                                              ) : (
                                                <span className="mt-0.5 block font-mono text-[11px] text-base-content/40">
                                                  {p}
                                                </span>
                                              )}
                                            </span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div
                                className={`sticky bottom-0 z-10 mt-2 flex flex-col gap-3 rounded-xl border-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between ${
                                  isDirty(m)
                                    ? "border-primary/40 bg-primary/10 shadow-lg shadow-primary/5"
                                    : "border-base-300/50 bg-base-100"
                                }`}
                              >
                                <div className="text-sm">
                                  {isDirty(m) ? (
                                    <p className="font-medium text-primary">
                                      Unsaved permission changes
                                    </p>
                                  ) : (
                                    <p className="text-base-content/60">
                                      No pending changes — edits sync when you save.
                                    </p>
                                  )}
                                  <p className="text-xs text-base-content/45">
                                    {savingId === m.id
                                      ? "Saving…"
                                      : "Sends in-app + email to this user when SMTP is configured."}
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    className="btn btn-ghost btn-sm gap-1"
                                    disabled={!isDirty(m) || savingId === m.id}
                                    onClick={() => discardDraft(m)}
                                  >
                                    <HiOutlineXMark className="h-4 w-4" />
                                    Discard
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-primary btn-sm min-w-[8.5rem]"
                                    disabled={!isDirty(m) || savingId === m.id}
                                    onClick={() => void savePermissions(m)}
                                  >
                                    {savingId === m.id ? (
                                      <span className="loading loading-spinner loading-xs" />
                                    ) : null}
                                    Save changes
                                  </button>
                                </div>
                              </div>
                            </>
                          )}

                          {canRevokeStaff && viewerId && m.id !== viewerId ? (
                            <div className="rounded-xl border border-error/35 bg-error/5 px-4 py-4 sm:px-5">
                              <p className="text-sm font-semibold text-error">Remove from team</p>
                              <p className="mt-1 text-xs leading-relaxed text-base-content/70">
                                Revoke staff access for this person. Their account stays active as a{" "}
                                <strong className="text-base-content">merchant</strong> user — they lose
                                admin permissions and notifications for this workspace.
                              </p>
                              <button
                                type="button"
                                className="btn btn-outline btn-error btn-sm mt-3 gap-2"
                                disabled={savingId === m.id}
                                onClick={() => {
                                  setRevokeTarget(m);
                                  setRevokeError(null);
                                  setRevokeOpen(true);
                                }}
                              >
                                <HiOutlineTrash className="h-4 w-4" />
                                Revoke staff access
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </section>

      <ConfirmDialog
        open={revokeOpen}
        onOpenChange={(open) => {
          setRevokeOpen(open);
          if (!open) {
            setRevokeTarget(null);
            setRevokeError(null);
          }
        }}
        title="Revoke staff access?"
        description={
          revokeTarget ? (
            <span>
              Remove administrator access for{" "}
              <strong className="text-foreground">{revokeTarget.name}</strong> ({revokeTarget.email}
              ). They will be switched to a merchant account.
            </span>
          ) : null
        }
        errorMessage={revokeError}
        confirmLabel="Revoke access"
        variant="danger"
        loading={revokeLoading}
        onConfirm={() => confirmRevokeStaff()}
      />
    </div>
  );
}
