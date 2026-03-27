"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  HiOutlineArrowRight,
  HiOutlineExclamationCircle,
  HiOutlineLockClosed,
  HiOutlineCheckCircle,
} from "react-icons/hi2";
import AuthLayout, { childVariants } from "@/components/auth/AuthLayout";
import PasswordStrengthMeter from "@/components/auth/PasswordStrengthMeter";
import { AuthPasswordInput } from "@/components/auth-credential-inputs";
import {
  REGISTER,
  resetPasswordFieldErrors,
  type ResetPasswordFieldErrors,
} from "@/lib/auth/register-validation";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get("email") ?? "";
  const tokenFromUrl = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ResetPasswordFieldErrors>({});
  const [loading, setLoading] = useState(false);

  const invalidLink = !emailFromUrl.trim() || !tokenFromUrl.trim();

  function clearField<K extends keyof ResetPasswordFieldErrors>(key: K) {
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
    if (invalidLink) return;

    const fe = resetPasswordFieldErrors({ password, confirmPassword });
    if (Object.keys(fe).length > 0) {
      setFieldErrors(fe);
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailFromUrl,
        token: tokenFromUrl,
        password,
        confirmPassword,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error ?? "Reset failed");
      return;
    }
    router.push("/login?reset=1");
    router.refresh();
  }

  return (
    <AuthLayout>
      <motion.div variants={childVariants} className="lm-auth-card">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15">
            <HiOutlineLockClosed className="h-7 w-7 text-primary" aria-hidden />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-[1.65rem]">
            Set new password
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {invalidLink
              ? "This link is invalid or incomplete."
              : `Resetting password for ${emailFromUrl}`}
          </p>
        </div>

        {invalidLink ? (
          /* ── Invalid link state ─────────────────────────────── */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 space-y-4 text-center"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-warning/15">
              <HiOutlineExclamationCircle className="h-8 w-8 text-warning" />
            </div>
            <p className="text-sm text-muted-foreground">
              Use the link from your password reset email, or request a new one.
            </p>
            <Link
              href="/forgot-password"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              Request new link
              <HiOutlineArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>
        ) : (
          /* ── Form ───────────────────────────────────────────── */
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <motion.div variants={childVariants} className="space-y-1.5">
              <AuthPasswordInput
                id="rp-password"
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

            <motion.div variants={childVariants} className="space-y-1.5">
              <AuthPasswordInput
                id="rp-confirm"
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
        )}

        {/* Footer */}
        <div className="mt-7 border-t border-border/50 pt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
          >
            <HiOutlineArrowRight className="h-3.5 w-3.5 rotate-180" />
            Back to sign in
          </Link>
        </div>
      </motion.div>
    </AuthLayout>
  );
}
