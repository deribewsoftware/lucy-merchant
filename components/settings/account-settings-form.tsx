"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { HiOutlineArrowRight, HiOutlineCog6Tooth } from "react-icons/hi2";

type ResolvedPrefs = {
  emailOrderUpdates: boolean;
  emailReviewsAndComments: boolean;
  emailChatMirrors: boolean;
  emailAccountAlerts: boolean;
};

export function AccountSettingsForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [prefs, setPrefs] = useState<ResolvedPrefs | null>(null);
  const [emailDeliveryConfigured, setEmailDeliveryConfigured] = useState<
    boolean | null
  >(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/me/settings", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error ?? "Could not load settings");
        return;
      }
      setName(String(data.name ?? ""));
      setEmail(String(data.email ?? ""));
      setPrefs(data.preferences as ResolvedPrefs);
      setEmailDeliveryConfigured(
        typeof data.emailDeliveryConfigured === "boolean"
          ? data.emailDeliveryConfigured
          : null,
      );
    } catch {
      setMessage("Could not load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prefs) return;
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
      setMessage("Saved.");
      setName(String(data.name ?? name));
      if (data.preferences) setPrefs(data.preferences as ResolvedPrefs);
      router.refresh();
    } catch {
      setMessage("Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !prefs) {
    return (
      <div className="lm-card border border-border/50 p-8 text-muted-foreground">
        Loading settings…
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="lm-card border border-border/50 p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <HiOutlineCog6Tooth className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground sm:text-2xl">
              Account &amp; settings
            </h1>
            <p className="text-sm text-muted-foreground">
              Profile and email notification preferences
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="set-name">
              Display name
            </label>
            <input
              id="set-name"
              className="input input-bordered w-full max-w-md bg-background"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>
          <div className="space-y-1.5">
            <span className="text-sm font-medium text-foreground">Email</span>
            <p className="rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-sm text-muted-foreground max-w-md">
              {email}
            </p>
            <p className="text-xs text-muted-foreground">
              Contact support to change your sign-in email.
            </p>
          </div>
        </div>
      </div>

      <div className="lm-card border border-border/50 p-6 sm:p-8">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Email notifications
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          When SMTP (Nodemailer) is configured, we can mirror in-app alerts to your inbox. In-app
          notifications are always created.
        </p>
        {emailDeliveryConfigured === false && (
          <div className="mt-4 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2.5 text-sm text-muted-foreground">
            Outbound email is not configured on this server (
            <code className="rounded bg-muted px-1 text-xs">NODEMAILER_FROM_EMAIL</code> and{" "}
            <code className="rounded bg-muted px-1 text-xs">NODEMAILER_PASSWORD</code>). Inbox mirroring
            will not work until this is set.
          </div>
        )}

        <ul className="mt-6 space-y-4">
          <li className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-foreground">Orders &amp; payments</p>
              <p className="text-sm text-muted-foreground">
                Order status, bank proofs, commissions, admin alerts on your orders
              </p>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={prefs.emailOrderUpdates}
              onChange={(e) =>
                setPrefs((p) =>
                  p ? { ...p, emailOrderUpdates: e.target.checked } : p,
                )
              }
            />
          </li>
          <li className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-foreground">Reviews &amp; comments</p>
              <p className="text-sm text-muted-foreground">
                Product and company reviews, Q&amp;A comments, moderation notices
              </p>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={prefs.emailReviewsAndComments}
              onChange={(e) =>
                setPrefs((p) =>
                  p ? { ...p, emailReviewsAndComments: e.target.checked } : p,
                )
              }
            />
          </li>
          <li className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-foreground">Order chat messages</p>
              <p className="text-sm text-muted-foreground">
                Mirror order chat to email (also requires{" "}
                <code className="rounded bg-muted px-1 text-xs">NODEMAILER_MIRROR_CHAT</code>{" "}
                on the server)
              </p>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={prefs.emailChatMirrors}
              onChange={(e) =>
                setPrefs((p) =>
                  p ? { ...p, emailChatMirrors: e.target.checked } : p,
                )
              }
            />
          </li>
          <li className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-foreground">Account &amp; verification</p>
              <p className="text-sm text-muted-foreground">
                Identity and company verification results, welcome messages
              </p>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={prefs.emailAccountAlerts}
              onChange={(e) =>
                setPrefs((p) =>
                  p ? { ...p, emailAccountAlerts: e.target.checked } : p,
                )
              }
            />
          </li>
        </ul>
      </div>

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

      {message ? (
        <p
          className={`text-sm ${message === "Saved." ? "text-success" : "text-error"}`}
          role="status"
        >
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        className="btn btn-primary"
        disabled={saving}
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
