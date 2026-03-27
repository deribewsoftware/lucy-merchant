"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import { Suspense } from "react";
import {
  HiOutlineArrowRight,
  HiOutlineExclamationCircle,
  HiOutlineLockClosed,
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

function ChangePasswordFormInner() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<
    ResetPasswordFieldErrors & { currentPassword?: string }
  >({});
  const [loading, setLoading] = useState(false);

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
    setSuccess(false);
    setFieldErrors({});

    const errs: typeof fieldErrors = {};

    if (!currentPassword) {
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
      body: JSON.stringify({ currentPassword, password, confirmPassword }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setMessage(data.error ?? "Failed to change password");
      return;
    }

    setSuccess(true);
    setCurrentPassword("");
    setPassword("");
    setConfirmPassword("");
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

        {/* Success */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex items-start gap-2.5 rounded-xl border border-success/25 bg-success/10 px-3.5 py-3 text-sm text-success"
          >
            <HiOutlineCheckCircle className="mt-0.5 h-4.5 w-4.5 shrink-0" aria-hidden />
            Your password has been updated successfully.
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={onSubmit} className="mt-7 space-y-4">
          {/* Current password */}
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

          {/* Divider */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-border/50 to-transparent" />

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
            href="/merchant/dashboard"
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
