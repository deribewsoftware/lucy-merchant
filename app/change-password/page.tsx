"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState, Suspense } from "react";
import {
  HiOutlineArrowRight,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineShieldCheck,
} from "react-icons/hi2";
import AuthLayout, { childVariants } from "@/components/auth/AuthLayout";
import PasswordStrengthMeter from "@/components/auth/PasswordStrengthMeter";
import { AuthPasswordInput } from "@/components/auth-credential-inputs";
import {
  REGISTER,
  resetPasswordFieldErrors,
  type ResetPasswordFieldErrors,
} from "@/lib/auth/register-validation";
import { ADMIN_INVITE_DEFAULT_PASSWORD } from "@/lib/auth/admin-invite";
import { defaultHomePath } from "@/lib/auth/portal-routes";
import { assertRolePath } from "@/lib/rbac";
import type { UserRole } from "@/lib/domain/types";

function ChangePasswordFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const requiredFlow = searchParams.get("required") === "1";
  const securityDefault = searchParams.get("security") === "default";
  const securityOauth = searchParams.get("security") === "oauth";

  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    ResetPasswordFieldErrors & { currentPassword?: string }
  >({});
  const [loading, setLoading] = useState(false);
  const [homeHref, setHomeHref] = useState("/merchant/dashboard");
  /** OAuth + must-change: server allows new password without current (no random password known). */
  const [skipCurrentPassword, setSkipCurrentPassword] = useState(false);

  useEffect(() => {
    void fetch("/api/auth/me")
      .then((r) => r.json())
      .then(
        (d: {
          user?: {
            role?: UserRole;
            adminAccessPending?: boolean;
            mustChangePassword?: boolean;
            authChannel?: "password" | "oauth";
          };
        }) => {
          const u = d.user;
          const role = u?.role;
          if (role) {
            setHomeHref(
              defaultHomePath(role, { adminAccessPending: u?.adminAccessPending }),
            );
          }
          if (
            u?.mustChangePassword === true &&
            (u.authChannel ?? "password") === "oauth"
          ) {
            setSkipCurrentPassword(true);
          }
        },
      )
      .catch(() => {});
  }, []);

  function clearField(key: string) {
    setFieldErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete (next as Record<string, string | undefined>)[key];
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setFieldErrors({});

    const errs: typeof fieldErrors = {};

    if (!skipCurrentPassword && !currentPassword) {
      errs.currentPassword = "Required";
    }

    const fe = resetPasswordFieldErrors({ password, confirmPassword });
    if (fe.password) errs.password = fe.password;
    if (fe.confirmPassword) errs.confirmPassword = fe.confirmPassword;

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(skipCurrentPassword ? {} : { currentPassword }),
        password,
        confirmPassword,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setMessage(data.error ?? "Failed to change password");
      return;
    }

    setCurrentPassword("");
    setPassword("");
    setConfirmPassword("");

    const meRes = await fetch("/api/auth/me");
    const meData = (await meRes.json().catch(() => ({}))) as {
      user?: { role?: UserRole; adminAccessPending?: boolean };
    };
    const role = meData.user?.role ?? "merchant";
    const adminAccessPending = meData.user?.adminAccessPending === true;
    const fallback = defaultHomePath(role, { adminAccessPending });
    let dest = fallback;
    if (
      nextParam &&
      nextParam.startsWith("/") &&
      assertRolePath(role, nextParam)
    ) {
      dest = nextParam;
    }
    router.push(dest);
    router.refresh();
  }

  return (
    <AuthLayout>
      <motion.div variants={childVariants} className="lm-auth-card">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15">
            <HiOutlineShieldCheck className="h-7 w-7 text-primary" aria-hidden />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-[1.65rem]">
            Change password
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Keep your account secure with a strong password
          </p>
        </div>

        {requiredFlow && securityDefault ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-3 text-left text-sm text-amber-950 dark:text-amber-100"
          >
            <p className="font-semibold">Security required</p>
            <p className="mt-1 leading-relaxed opacity-95">
              Your administrator account was created with the default password{" "}
              <code className="rounded bg-black/10 px-1 py-0.5 font-mono text-xs dark:bg-white/10">
                {ADMIN_INVITE_DEFAULT_PASSWORD}
              </code>
              . Set a new password now before continuing to the admin workspace.
            </p>
          </motion.div>
        ) : null}

        {requiredFlow && securityOauth ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3.5 py-3 text-left text-sm text-sky-950 dark:text-sky-100"
          >
            <p className="font-semibold">Set a password</p>
            <p className="mt-1 leading-relaxed opacity-95">
              You signed in with Google. Choose a password for this account so you can also sign in with
              email when needed.
            </p>
          </motion.div>
        ) : null}

        {/* Form */}
        <form onSubmit={onSubmit} className="mt-7 space-y-4">
          {/* Current password */}
          {!skipCurrentPassword ? (
            <>
              <motion.div variants={childVariants} className="space-y-1.5">
                <AuthPasswordInput
                  id="current-password"
                  required
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    clearField("currentPassword");
                  }}
                  aria-invalid={Boolean(fieldErrors.currentPassword)}
                  error={Boolean(fieldErrors.currentPassword)}
                  label="Current password"
                />
                {fieldErrors.currentPassword && (
                  <p className="px-0.5 text-sm text-error">{fieldErrors.currentPassword}</p>
                )}
              </motion.div>

              <div className="h-px w-full bg-gradient-to-r from-transparent via-border/50 to-transparent" />
            </>
          ) : null}

          {/* New password */}
          <motion.div variants={childVariants} className="space-y-1.5">
            <AuthPasswordInput
              id="new-password"
              required
              autoComplete="new-password"
              minLength={REGISTER.passwordMin}
              maxLength={REGISTER.passwordMax}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearField("password");
              }}
              aria-invalid={Boolean(fieldErrors.password)}
              error={Boolean(fieldErrors.password)}
              label="New password"
            />
            <PasswordStrengthMeter password={password} />
            {fieldErrors.password && (
              <p className="px-0.5 text-sm text-error">{fieldErrors.password}</p>
            )}
          </motion.div>

          {/* Confirm new password */}
          <motion.div variants={childVariants} className="space-y-1.5">
            <AuthPasswordInput
              id="confirm-new-password"
              required
              autoComplete="new-password"
              minLength={REGISTER.passwordMin}
              maxLength={REGISTER.passwordMax}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                clearField("confirmPassword");
              }}
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
              error={Boolean(fieldErrors.confirmPassword)}
              success={Boolean(confirmPassword && password === confirmPassword)}
              label="Confirm new password"
              toggleLabels={{ show: "Show confirm password", hide: "Hide confirm password" }}
            />
            {confirmPassword && password && password === confirmPassword && (
              <p className="flex items-center gap-1 px-0.5 text-[11px] font-medium text-success">
                <HiOutlineCheckCircle className="h-3.5 w-3.5" />
                Passwords match
              </p>
            )}
            {fieldErrors.confirmPassword && (
              <p className="px-0.5 text-sm text-error">{fieldErrors.confirmPassword}</p>
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
              {message}
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
                  Updating…
                </>
              ) : (
                <>
                  Update password
                  <HiOutlineArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </motion.div>
        </form>

        {/* Footer */}
        <div className="mt-7 border-t border-border/50 pt-6 text-center">
          <Link
            href={homeHref}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
          >
            <HiOutlineArrowRight className="h-3.5 w-3.5 rotate-180" />
            Back to dashboard
          </Link>
        </div>
      </motion.div>
    </AuthLayout>
  );
}

export default function ChangePasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <ChangePasswordFormInner />
    </Suspense>
  );
}
