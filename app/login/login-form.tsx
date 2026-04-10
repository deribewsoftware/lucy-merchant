"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  HiOutlineArrowRight,
  HiOutlineExclamationCircle,
  HiOutlineShieldCheck,
  HiOutlineCheckCircle,
} from "react-icons/hi2";
import AuthLayout, { childVariants } from "@/components/auth/AuthLayout";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";
import { AuthEmailInput, AuthPasswordInput } from "@/components/auth-credential-inputs";
import { LM_LOGIN_EVENT } from "@/components/presence-provider";
import { defaultHomePath, PORTAL_ACCESS_ROWS, portalAreaLabel } from "@/lib/auth/portal-routes";
import { loginFieldErrors, type LoginFieldErrors } from "@/lib/auth/login-validation";
import type { LoginSuccessResponse } from "@/lib/domain/types";
import { assertRolePath } from "@/lib/rbac";

/** Legacy `?error=forbidden` — staff are now redirected in-app; this helps old bookmarks. */
function StaffAccessNotice() {
  const searchParams = useSearchParams();
  const err = searchParams.get("error");
  const next = searchParams.get("next") ?? "";
  if (err !== "forbidden") return null;
  const attempted = next && next.startsWith("/") ? next : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/8 via-card to-card p-4 text-left shadow-sm sm:p-5"
    >
      <div className="flex gap-3">
        <HiOutlineExclamationCircle className="mt-0.5 h-6 w-6 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
        <div className="min-w-0 space-y-3">
          <div>
            <p className="font-semibold text-foreground">That page needs the right access</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Staff accounts use <strong className="text-foreground">permissions</strong> (dashboard, orders,
              moderation, etc.). If you opened a link you can&apos;t use yet, a system administrator can grant
              capabilities under <strong className="text-foreground">Team &amp; roles</strong>. Merchant and
              supplier accounts use different workspaces — after sign-in we take you to the home that matches
              your role.
            </p>
          </div>
          {attempted ? (
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Requested URL:</span>{" "}
              <code className="break-all rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">
                {attempted}
              </code>
              <span className="mt-1 block text-muted-foreground/90">
                ({portalAreaLabel(attempted)})
              </span>
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Quick map: <span className="font-mono text-[11px] text-foreground">/admin</span> staff ·{" "}
            <span className="font-mono text-[11px] text-foreground">/supplier</span> suppliers ·{" "}
            <span className="font-mono text-[11px] text-foreground">/merchant</span> merchants ·{" "}
            <span className="font-mono text-[11px] text-foreground">/notifications</span> all signed-in roles
          </p>
          <details className="group text-xs text-muted-foreground">
            <summary className="cursor-pointer font-medium text-foreground underline-offset-2 hover:underline">
              Full workspace reference
            </summary>
            <div className="mt-2 overflow-hidden rounded-lg border border-border/60">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-muted/40 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
                  <tr>
                    <th className="px-3 py-2">Prefix</th>
                    <th className="px-3 py-2">Who signs in here</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {PORTAL_ACCESS_ROWS.map((row) => (
                    <tr key={row.prefix} className="bg-card/50">
                      <td className="px-3 py-2 align-top">
                        <span className="font-mono text-[11px] text-primary">{row.prefix}</span>
                        <span className="mt-0.5 block text-muted-foreground">{row.title}</span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        <span className="font-medium text-foreground">{row.roles}</span>
                        <span className="mt-0.5 block text-xs opacity-90">{row.description}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      </div>
    </motion.div>
  );
}

export function LoginForm({ googleOAuthConfigured }: { googleOAuthConfigured: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";
  const err = searchParams.get("error");
  const oauthDetail = searchParams.get("detail");
  const verified = searchParams.get("verified");
  const reset = searchParams.get("reset");
  const staffFromVerify = searchParams.get("staff") === "1";
  const securityDefaultHint = searchParams.get("security") === "default";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [message, setMessage] = useState<string | null>(() => {
    if (err === "forbidden") return null;
    if (verified === "1") return null; // handled as success banner
    if (reset === "1") return null; // handled as success banner
    return null;
  });
  const [successMessage] = useState<string | null>(() => {
    if (verified === "1") return "Email verified successfully! You can now sign in.";
    if (reset === "1") return "Password updated successfully! You can now sign in.";
    return null;
  });
  const [verifyLinkEmail, setVerifyLinkEmail] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [loading, setLoading] = useState(false);

  const emailParam = searchParams.get("email");
  useEffect(() => {
    const pre = emailParam?.trim();
    if (pre) setEmail(pre);
  }, [emailParam]);

  useEffect(() => {
    if (err !== "oauth" || !oauthDetail) return;
    const copy: Record<string, string> = {
      cancelled: "Google sign-in was cancelled.",
      google_not_configured: "Google sign-in is not configured on the server.",
      unsupported_provider: "That sign-in provider is not available.",
      missing_code: "Google did not return a sign-in code. Try again.",
      bad_state: "Sign-in session expired. Please try again.",
      oauth_redirect_mismatch:
        "Google rejected the redirect address for this app. The developer must add the exact callback URL in Google Cloud Console.",
      oauth_invalid_grant:
        "This Google sign-in link expired or was already used. Close the tab and try Sign in with Google again.",
      token_exchange_failed: "Could not complete Google sign-in. Try again.",
      create_failed: "Could not create an account. You may already be registered — try email sign-in.",
      invalid_role: "Could not determine account type. Use the registration form.",
    };
    setMessage(copy[oauthDetail] ?? "Sign-in with Google failed. Try again.");
  }, [err, oauthDetail]);

  function clearField<K extends keyof LoginFieldErrors>(key: K) {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setFieldErrors({});

    const fe = loginFieldErrors({ email, password });
    if (Object.keys(fe).length > 0) {
      setFieldErrors(fe);
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = (await res.json().catch(() => ({}))) as
      | LoginSuccessResponse
      | { error?: string; code?: string };
    setLoading(false);
    if (!res.ok) {
      if (res.status === 403 && "code" in data && data.code === "EMAIL_NOT_VERIFIED") {
        setVerifyLinkEmail(email);
        setMessage(data.error ?? "Verify your email before signing in.");
        return;
      }
      setVerifyLinkEmail(null);
      setMessage("error" in data && data.error ? data.error : "Login failed");
      return;
    }
    if (!("user" in data) || !data.user) {
      setMessage("Login failed");
      return;
    }
    setVerifyLinkEmail(null);
    const login = data as LoginSuccessResponse;
    const role = login.user.role;
    const adminAccessPending = login.adminAccessPending === true;
    const mustChangePassword = login.mustChangePassword === true;
    const fallback =
      role === "admin" || role === "system_admin"
        ? (login.staffHomePath ?? defaultHomePath(role, { adminAccessPending }))
        : defaultHomePath(role, { adminAccessPending });
    const allowLockedNext = (p: string) =>
      p.startsWith("/admin/settings") || p.startsWith("/admin/pending-access");
    let dest = next && next.startsWith("/") ? next : fallback;
    if (next && next.startsWith("/") && !assertRolePath(role, next)) {
      dest = fallback;
    }
    if (adminAccessPending && dest && !allowLockedNext(dest)) {
      dest = "/admin/pending-access";
    }
    if (mustChangePassword) {
      const qs = new URLSearchParams({
        required: "1",
        security: "default",
        next: dest,
      });
      window.dispatchEvent(new CustomEvent(LM_LOGIN_EVENT));
      router.push(`/change-password?${qs.toString()}`);
      router.refresh();
      return;
    }
    window.dispatchEvent(new CustomEvent(LM_LOGIN_EVENT));
    router.push(dest);
    router.refresh();
  }

  return (
    <AuthLayout>
      {/* Card */}
      <motion.div variants={childVariants} className="lm-auth-card">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15">
            <HiOutlineShieldCheck className="h-7 w-7 text-primary" aria-hidden />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-[1.65rem]">
            Welcome back
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Sign in to access your dashboard
          </p>
        </div>

        {/* Social auth */}
        <div className="mt-7">
          <SocialAuthButtons mode="login" googleOAuthConfigured={googleOAuthConfigured} />
        </div>

        <StaffAccessNotice />

        {/* Success banner */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-start gap-2.5 rounded-xl border border-success/25 bg-success/10 px-3.5 py-3 text-sm text-success"
          >
            <HiOutlineCheckCircle className="mt-0.5 h-4.5 w-4.5 shrink-0" aria-hidden />
            <div className="min-w-0 text-left">
              <p>{successMessage}</p>
              {verified === "1" && staffFromVerify ? (
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Use the <strong className="text-foreground">email and password</strong> from your
                  invitation message.{" "}
                  {securityDefaultHint
                    ? "You still have the default password — after sign-in you will set a new password before opening the admin workspace."
                    : "Then continue to your workspace."}
                </p>
              ) : null}
            </div>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <motion.div variants={childVariants} className="space-y-1.5">
            <AuthEmailInput
              id="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearField("email");
              }}
              aria-invalid={Boolean(fieldErrors.email)}
              error={Boolean(fieldErrors.email)}
              autoComplete="email"
            />
            {fieldErrors.email && (
              <p className="px-0.5 text-sm text-error">{fieldErrors.email}</p>
            )}
          </motion.div>

          <motion.div variants={childVariants} className="space-y-1.5">
            <AuthPasswordInput
              id="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearField("password");
              }}
              aria-invalid={Boolean(fieldErrors.password)}
              error={Boolean(fieldErrors.password)}
            />
            <div className="flex items-center justify-between px-0.5">
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-base-300 text-primary focus:ring-primary/30"
                />
                Remember me
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            {fieldErrors.password && (
              <p className="px-0.5 text-sm text-error">{fieldErrors.password}</p>
            )}
          </motion.div>

          {/* Error message */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2.5 rounded-xl border border-error/25 bg-error/10 px-3.5 py-3 text-sm text-error"
            >
              <HiOutlineExclamationCircle className="mt-0.5 h-4.5 w-4.5 shrink-0" aria-hidden />
              <span className="inline-block space-y-1">
                {message}
                {oauthDetail === "oauth_redirect_mismatch" && (
                  <Link
                    href="/api/health/oauth"
                    className="mt-2 block text-xs font-medium text-primary hover:text-primary/80"
                  >
                    View the exact redirect URL this site uses →
                  </Link>
                )}
                {verifyLinkEmail && (
                  <Link
                    href={`/verify-email?email=${encodeURIComponent(verifyLinkEmail)}`}
                    className="block font-medium text-primary hover:text-primary/80"
                  >
                    Enter verification code →
                  </Link>
                )}
              </span>
            </motion.div>
          )}

          {/* Submit */}
          <motion.div variants={childVariants}>
            <button
              type="submit"
              disabled={loading}
              className="lm-auth-btn group"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <HiOutlineArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </motion.div>
        </form>

        {/* Footer */}
        <div className="mt-7 border-t border-border/50 pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
            >
              Create account
            </Link>
          </p>
        </div>
      </motion.div>
    </AuthLayout>
  );
}
