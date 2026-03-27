"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  HiOutlineArrowRight,
  HiOutlineExclamationCircle,
  HiOutlineKey,
  HiOutlineEnvelope,
  HiOutlineCheckCircle,
} from "react-icons/hi2";
import AuthLayout, { childVariants } from "@/components/auth/AuthLayout";
import { AuthEmailInput } from "@/components/auth-credential-inputs";
import { isValidEmail } from "@/lib/auth/register-validation";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setEmailError(null);
    if (!email.trim()) {
      setEmailError("Required");
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError("Enter a valid email address");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error ?? "Request failed");
      return;
    }
    setDone(true);
    setMessage(data.message ?? "Check your email for a reset link.");
  }

  return (
    <AuthLayout>
      <motion.div variants={childVariants} className="lm-auth-card">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15">
            <HiOutlineKey className="h-7 w-7 text-primary" aria-hidden />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-[1.65rem]">
            Forgot your password?
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            No worries — enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        {done ? (
          /* ── Success state ──────────────────────────────────── */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 space-y-4 text-center"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <HiOutlineEnvelope className="h-8 w-8 text-success" />
              </motion.div>
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Check your inbox
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {message}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/40 px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Didn&apos;t receive the email? Check your spam folder or{" "}
                <button
                  type="button"
                  onClick={() => {
                    setDone(false);
                    setMessage(null);
                  }}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  try again
                </button>
              </p>
            </div>
          </motion.div>
        ) : (
          /* ── Form ───────────────────────────────────────────── */
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <motion.div variants={childVariants} className="space-y-1.5">
              <AuthEmailInput
                id="fp-email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(null);
                }}
                aria-invalid={Boolean(emailError)}
                error={Boolean(emailError)}
              />
              {emailError && (
                <p className="px-0.5 text-sm text-error">{emailError}</p>
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
                    Sending…
                  </>
                ) : (
                  <>
                    Send reset link
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
