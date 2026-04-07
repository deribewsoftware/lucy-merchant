"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  HiOutlineArrowRight,
  HiOutlineBell,
  HiOutlineClipboardDocument,
  HiOutlineCog6Tooth,
  HiOutlineShieldCheck,
} from "react-icons/hi2";
import type { Permission, VerificationStatus } from "@/lib/domain/types";
import { STAFF_PERMISSION_LABELS } from "@/lib/admin-permission-labels";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeAppearanceSection } from "@/components/settings/theme-appearance-section";

type ResolvedPrefs = {
  emailOrderUpdates: boolean;
  emailReviewsAndComments: boolean;
  emailChatMirrors: boolean;
  emailAccountAlerts: boolean;
};

/** Matches server `resolveEmailPreferences` defaults when API omits fields */
function normalizePreferences(raw: unknown): ResolvedPrefs {
  if (!raw || typeof raw !== "object") {
    return {
      emailOrderUpdates: true,
      emailReviewsAndComments: true,
      emailChatMirrors: false,
      emailAccountAlerts: true,
    };
  }
  const p = raw as Record<string, unknown>;
  return {
    emailOrderUpdates: p.emailOrderUpdates !== false,
    emailReviewsAndComments: p.emailReviewsAndComments !== false,
    emailChatMirrors: p.emailChatMirrors === true,
    emailAccountAlerts: p.emailAccountAlerts !== false,
  };
}

export type AccountSettingsPortal = "merchant" | "supplier" | "staff";

const PORTAL_SUBTITLE: Record<AccountSettingsPortal, string> = {
  merchant:
    "Your merchant profile and email notification preferences for orders and the marketplace.",
  supplier:
    "Your supplier profile and email notification preferences for listings, orders, and verification.",
  staff:
    "Your staff profile and email notification preferences for admin activity.",
};

const MAX_NAME_LEN = 200;

type EmailRowKey = "orders" | "reviews" | "chat" | "account";

const EMAIL_ROWS: Record<
  AccountSettingsPortal,
  Record<EmailRowKey, { title: string; description: string }>
> = {
  merchant: {
    orders: {
      title: "Orders & payments",
      description:
        "Order status, bank proofs, commissions, and alerts on your purchases",
    },
    reviews: {
      title: "Reviews & comments",
      description:
        "Product and company reviews, Q&A comments, and moderation notices",
    },
    chat: {
      title: "Order chat messages",
      description:
        "Mirror order chat to email (server must enable NODEMAILER_MIRROR_CHAT)",
    },
    account: {
      title: "Account & verification",
      description: "Identity verification, welcome messages, and account notices",
    },
  },
  supplier: {
    orders: {
      title: "Orders & payments",
      description:
        "Incoming orders, payouts, bank proofs, commissions, and platform alerts",
    },
    reviews: {
      title: "Reviews & comments",
      description:
        "Reviews on your products and companies, Q&A, and moderation notices",
    },
    chat: {
      title: "Order chat messages",
      description:
        "Mirror order chat to email (server must enable NODEMAILER_MIRROR_CHAT)",
    },
    account: {
      title: "Account & verification",
      description: "Company and identity verification, welcome messages",
    },
  },
  staff: {
    orders: {
      title: "Orders & payments",
      description:
        "Platform order workflow, bank reviews, commissions, and payment alerts",
    },
    reviews: {
      title: "Reviews & comments",
      description:
        "Moderation queues, product and company reviews, and public comments",
    },
    chat: {
      title: "Order chat messages",
      description:
        "Mirror order chat to email when server chat mirroring is enabled",
    },
    account: {
      title: "Account & access",
      description: "Team access, verification notices, and staff account messages",
    },
  },
};

function formatMemberSince(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

function nationalIdSummary(status: VerificationStatus): string {
  switch (status) {
    case "none":
      return "Not submitted";
    case "pending":
      return "Under review";
    case "approved":
      return "Approved";
    case "rejected":
      return "Action required";
    default:
      return status;
  }
}

function sortStaffPermissions(perms: Permission[]): Permission[] {
  return [...perms].sort((a, b) => {
    const la = STAFF_PERMISSION_LABELS[a];
    const lb = STAFF_PERMISSION_LABELS[b];
    const ga = la?.group ?? "Other";
    const gb = lb?.group ?? "Other";
    if (ga !== gb) return ga.localeCompare(gb);
    return (la?.title ?? a).localeCompare(lb?.title ?? b);
  });
}

function prefKeyForRow(key: EmailRowKey): keyof ResolvedPrefs {
  switch (key) {
    case "orders":
      return "emailOrderUpdates";
    case "reviews":
      return "emailReviewsAndComments";
    case "chat":
      return "emailChatMirrors";
    case "account":
      return "emailAccountAlerts";
    default:
      return "emailOrderUpdates";
  }
}

export function AccountSettingsForm({
  portal = "merchant",
}: {
  portal?: AccountSettingsPortal;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [prefs, setPrefs] = useState<ResolvedPrefs | null>(null);
  const [emailDeliveryConfigured, setEmailDeliveryConfigured] = useState<
    boolean | null
  >(null);

  const [roleDisplay, setRoleDisplay] = useState<string>("");
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [nationalIdStatus, setNationalIdStatus] =
    useState<VerificationStatus | null>(null);
  const [staffAccessPending, setStaffAccessPending] = useState(false);
  const [userId, setUserId] = useState("");
  const [staffPermissions, setStaffPermissions] = useState<
    Permission[] | null
  >(null);
  const [supplierPoints, setSupplierPoints] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const [baseline, setBaseline] = useState<{
    name: string;
    prefs: ResolvedPrefs;
  } | null>(null);

  const dirty = useMemo(() => {
    if (!baseline || !prefs) return false;
    return (
      name.trim() !== baseline.name ||
      JSON.stringify(prefs) !== JSON.stringify(baseline.prefs)
    );
  }, [baseline, name, prefs]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/me/settings", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoadError(String(data.error ?? "Could not load settings"));
        setPrefs(null);
        setBaseline(null);
        setUserId("");
        setStaffPermissions(null);
        setSupplierPoints(null);
        return;
      }
      const loadedName = String(data.name ?? "").trim();
      const loadedPrefs = normalizePreferences(data.preferences);
      setName(loadedName);
      setEmail(String(data.email ?? ""));
      setPrefs(loadedPrefs);
      setBaseline({ name: loadedName, prefs: loadedPrefs });
      setEmailDeliveryConfigured(
        typeof data.emailDeliveryConfigured === "boolean"
          ? data.emailDeliveryConfigured
          : null,
      );
      setRoleDisplay(String(data.roleDisplay ?? ""));
      setCreatedAt(
        typeof data.createdAt === "string" ? data.createdAt : null,
      );
      setEmailVerified(data.emailVerified !== false);
      setMustChangePassword(data.mustChangePassword === true);
      setStaffAccessPending(data.staffAccessPending === true);
      if (
        data.nationalIdStatus === "none" ||
        data.nationalIdStatus === "pending" ||
        data.nationalIdStatus === "approved" ||
        data.nationalIdStatus === "rejected"
      ) {
        setNationalIdStatus(data.nationalIdStatus);
      } else {
        setNationalIdStatus(null);
      }
      setUserId(String(data.userId ?? ""));
      setStaffPermissions(
        Array.isArray(data.staffPermissions)
          ? (data.staffPermissions as Permission[])
          : null,
      );
      setSupplierPoints(
        typeof data.supplierPoints === "number" ? data.supplierPoints : null,
      );
    } catch {
      setLoadError("Could not load settings");
      setPrefs(null);
      setBaseline(null);
      setUserId("");
      setStaffPermissions(null);
      setSupplierPoints(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm() {
    if (!baseline) return;
    setName(baseline.name);
    setPrefs({ ...baseline.prefs });
    setMessage(null);
  }

  function setAllEmailMirrors(enabled: boolean) {
    setPrefs((p) =>
      p
        ? {
            ...p,
            emailOrderUpdates: enabled,
            emailReviewsAndComments: enabled,
            emailChatMirrors: enabled,
            emailAccountAlerts: enabled,
          }
        : p,
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prefs || !dirty) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/me/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          preferences: {
            emailOrderUpdates: prefs.emailOrderUpdates,
            emailReviewsAndComments: prefs.emailReviewsAndComments,
            emailChatMirrors: prefs.emailChatMirrors,
            emailAccountAlerts: prefs.emailAccountAlerts,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error ?? "Save failed");
        return;
      }
      const nextName = String(data.name ?? name).trim();
      const nextPrefs = normalizePreferences(data.preferences);
      setMessage("Saved.");
      setName(nextName);
      setPrefs(nextPrefs);
      setBaseline({ name: nextName, prefs: nextPrefs });
      router.refresh();
    } catch {
      setMessage("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function copyUserId() {
    if (!userId || !navigator.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(userId);
      setCopiedId(true);
      window.setTimeout(() => setCopiedId(false), 2000);
    } catch {
      setMessage("Could not copy to clipboard");
    }
  }

  const memberSince = formatMemberSince(createdAt);
  const verificationHref =
    portal === "supplier" ? "/supplier/verification" : "/merchant/verification";
  const rows = EMAIL_ROWS[portal];

  if (loading) {
    return (
      <div className="lm-card border border-border/50 p-8 text-muted-foreground">
        Loading settings…
      </div>
    );
  }

  if (loadError || !prefs) {
    return (
      <div className="lm-card border border-border/50 p-8">
        <p className="text-error text-sm" role="alert">
          {loadError ?? "Could not load settings"}
        </p>
        <button
          type="button"
          className="btn btn-primary mt-4"
          onClick={() => void load()}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {mustChangePassword ? (
        <div
          className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground"
          role="status"
        >
          <p className="font-medium">Password change required</p>
          <p className="mt-1 text-muted-foreground">
            You must set a new password before using admin tools. You can still save profile
            settings here.
          </p>
          <Link
            href="/change-password?required=1"
            className="mt-2 inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            Change password now
            <HiOutlineArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : null}

      {staffAccessPending ? (
        <div className="rounded-xl border border-border/50 bg-muted/30 px-4 py-3 text-sm">
          <p className="font-medium text-foreground">Access pending</p>
          <p className="mt-1 text-muted-foreground">
            A system administrator has not granted portal permissions yet. You can update your
            profile and preferences below.
          </p>
          <Link
            href="/admin/pending-access"
            className="mt-2 inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            View access status
            <HiOutlineArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : null}

      <div className="lm-card border border-border/50 p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <HiOutlineCog6Tooth className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground sm:text-2xl">
                Account &amp; settings
              </h1>
              <p className="text-sm text-muted-foreground">{PORTAL_SUBTITLE[portal]}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {roleDisplay ? (
              <span className="badge badge-outline border-border/60 font-normal">
                {roleDisplay}
              </span>
            ) : null}
            {memberSince ? (
              <span className="badge badge-ghost font-normal text-muted-foreground">
                Member since {memberSince}
              </span>
            ) : null}
            {portal === "supplier" && supplierPoints !== null ? (
              <span className="badge badge-outline border-border/60 font-normal">
                Posting balance: {supplierPoints} pts
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="set-name">
                Display name
              </label>
              <input
                id="set-name"
                className="input input-bordered w-full max-w-md bg-background"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, MAX_NAME_LEN))}
                required
                maxLength={MAX_NAME_LEN}
                autoComplete="name"
                aria-invalid={name.trim().length === 0}
              />
              <p className="text-xs text-muted-foreground">
                {name.length}/{MAX_NAME_LEN} characters
              </p>
            </div>
            <div className="space-y-1.5">
              <span className="text-sm font-medium text-foreground">Sign-in email</span>
              <p className="rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-sm text-muted-foreground max-w-md">
                {email}
              </p>
              <p className="text-xs text-muted-foreground">
                Contact support to change your sign-in email.
              </p>
              {!emailVerified ? (
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Email not verified.{" "}
                  <Link href="/verify-email" className="font-medium underline">
                    Verify now
                  </Link>
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Email verified</p>
              )}
            </div>
            {userId ? (
              <div className="space-y-1.5">
                <span className="text-sm font-medium text-foreground">Account ID</span>
                <div className="flex max-w-md flex-wrap items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-lg border border-border/50 bg-muted/30 px-3 py-2 font-mono text-xs text-muted-foreground">
                    {userId}
                  </code>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm shrink-0 gap-1"
                    onClick={() => void copyUserId()}
                  >
                    <HiOutlineClipboardDocument className="h-4 w-4" aria-hidden />
                    {copiedId ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this with support if you need help with your account.
                </p>
              </div>
            ) : null}
          </div>

          <div className="space-y-3 rounded-xl border border-border/40 bg-muted/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Shortcuts
            </p>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/notifications"
                  className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  <HiOutlineBell className="h-4 w-4 shrink-0" aria-hidden />
                  In-app notifications
                </Link>
              </li>
              {portal !== "staff" ? (
                <li>
                  <Link
                    href={verificationHref}
                    className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    <HiOutlineShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
                    Identity verification
                    <span className="text-muted-foreground font-normal">
                      —{" "}
                      {nationalIdStatus
                        ? nationalIdSummary(nationalIdStatus)
                        : "—"}
                    </span>
                  </Link>
                </li>
              ) : null}
              <li className="pt-1">
                <SignOutButton className="px-0" />
              </li>
            </ul>
          </div>
        </div>
      </div>

      {portal === "staff" && staffPermissions !== null ? (
        <div className="lm-card border border-border/50 p-6 sm:p-8">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Portal access
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Permissions granted to your admin account. Contact a system administrator to change
            them.
          </p>
          {staffPermissions.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No permissions yet — use{" "}
              <Link href="/admin/pending-access" className="font-medium text-primary underline">
                Access pending
              </Link>{" "}
              to request access.
            </p>
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {sortStaffPermissions(staffPermissions).map((perm) => {
                const meta = STAFF_PERMISSION_LABELS[perm];
                return (
                  <li
                    key={perm}
                    className="rounded-lg border border-border/40 bg-muted/15 px-3 py-2.5"
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {meta?.group ?? "Access"}
                    </p>
                    <p className="font-medium text-foreground">{meta?.title ?? perm}</p>
                    {meta?.description ? (
                      <p className="mt-0.5 text-sm text-muted-foreground">{meta.description}</p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}

      <div className="lm-card border border-border/50 p-6 sm:p-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              Email notifications
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              When SMTP (Nodemailer) is configured, we can mirror in-app alerts to your inbox.
              In-app notifications are always created.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setAllEmailMirrors(true)}
            >
              Enable all
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setAllEmailMirrors(false)}
            >
              Mute all
            </button>
          </div>
        </div>
        {emailDeliveryConfigured === false && (
          <div className="mt-4 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2.5 text-sm text-muted-foreground">
            Outbound email is not configured on this server (
            <code className="rounded bg-muted px-1 text-xs">NODEMAILER_FROM_EMAIL</code> and{" "}
            <code className="rounded bg-muted px-1 text-xs">NODEMAILER_PASSWORD</code>). Inbox
            mirroring will not work until this is set.
          </div>
        )}

        <ul className="mt-6 space-y-4">
          {(Object.keys(rows) as EmailRowKey[]).map((key) => {
            const row = rows[key];
            const pk = prefKeyForRow(key);
            return (
              <li
                key={key}
                className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-foreground">{row.title}</p>
                  <p className="text-sm text-muted-foreground">{row.description}</p>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={prefs[pk]}
                  onChange={(e) =>
                    setPrefs((p) =>
                      p ? { ...p, [pk]: e.target.checked } : p,
                    )
                  }
                  aria-label={row.title}
                />
              </li>
            );
          })}
        </ul>
      </div>

      <ThemeAppearanceSection />

      <div className="lm-card border border-border/50 p-6 sm:p-8">
        <h2 className="font-display text-lg font-semibold text-foreground">Security</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Password reset and security emails are always sent when you request them.
        </p>
        <Link
          href="/change-password"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          Change password
          <HiOutlineArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="lm-card border border-border/50 p-6 sm:p-8">
        <h2 className="font-display text-lg font-semibold text-foreground">Help &amp; legal</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Policies and answers that apply to all accounts.
        </p>
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
          <li>
            <Link href="/faq" className="text-primary hover:underline">
              FAQ
            </Link>
          </li>
          <li>
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy policy
            </Link>
          </li>
          <li>
            <Link href="/terms" className="text-primary hover:underline">
              Terms of service
            </Link>
          </li>
        </ul>
      </div>

      {message ? (
        <p
          className={`text-sm ${message === "Saved." ? "text-success" : "text-error"}`}
          role="status"
        >
          {message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={saving || !dirty}
          aria-busy={saving}
        >
          {saving ? "Saving…" : dirty ? "Save changes" : "No changes to save"}
        </button>
        {dirty ? (
          <button
            type="button"
            className="btn btn-ghost"
            disabled={saving}
            onClick={resetForm}
          >
            Discard changes
          </button>
        ) : null}
      </div>
    </form>
  );
}
