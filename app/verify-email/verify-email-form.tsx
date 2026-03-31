"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import {
  HiOutlineArrowRight,
  HiOutlineExclamationCircle,
  HiOutlineEnvelope,
  HiOutlineArrowPath,
} from "react-icons/hi2";
import AuthLayout, { childVariants } from "@/components/auth/AuthLayout";
import OtpInput from "@/components/auth/OtpInput";
import { AuthEmailInput } from "@/components/auth-credential-inputs";
import { isValidEmail } from "@/lib/auth/register-validation";

type FieldErrors = { email?: string; code?: string };

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") ?? "";
  const noEmailHint = searchParams.get("hint") === "no-email";
  const sendFailedHint = searchParams.get("hint") === "send-failed";

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  /** From server — URL `hint=no-email` can be stale after NODEMAILER_* is added */
  const [emailDeliveryConfigured, setEmailDeliveryConfigured] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/health/email", { cache: "no-store" })
      .then((r) => r.json().catch(() => ({})))
      .then((data: {
        email?: { configured?: boolean };
        nodemailer?: { configured?: boolean };
      }) => {
        if (cancelled) return;
        const ok =
          Boolean(data?.email?.configured) ||
          Boolean(data?.nodemailer?.configured);
        setEmailDeliveryConfigured(ok);
      })
      .catch(() => {
        if (!cancelled) setEmailDeliveryConfigured(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Drop stale `hint=no-email` from the URL once we know email is configured */
  useEffect(() => {
    if (emailDeliveryConfigured !== true) return;
    if (searchParams.get("hint") !== "no-email") return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("hint");
    const qs = params.toString();
    router.replace(`/verify-email${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [emailDeliveryConfigured, router, searchParams]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  function clearField<K extends keyof FieldErrors>(key: K) {
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

    const next: FieldErrors = {};
    if (!email.trim()) {
      next.email = "Required";
    } else if (!isValidEmail(email)) {
      next.email = "Enter a valid email address";
    }
    const digits = code.replace(/\D/g, "");
    if (digits.length !== 6) {
      next.code = "Enter the 6-digit code from your email";
    }
    if (Object.keys(next).length > 0) {
      setFieldErrors(next);
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code: digits }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error ?? "Verification failed");
      return;
    }
    const qs = new URLSearchParams();
    qs.set("verified", "1");
    qs.set("email", email.trim());
    if (data.staffRole === true) qs.set("staff", "1");
    if (data.defaultPasswordPending === true) qs.set("security", "default");
    router.push(`/login?${qs.toString()}`);
    router.refresh();
  }

  const onResend = useCallback(async () => {
    setMessage(null);
    setFieldErrors({});
    if (!email.trim()) {
      setFieldErrors({ email: "Required" });
      return;
    }
    if (!isValidEmail(email)) {
      setFieldErrors({ email: "Enter a valid email address" });
      return;
    }
    setResendLoading(true);
    const res = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    setResendLoading(false);
    if (!res.ok) {
      const base = data.error ?? "Could not resend code";
      const detail =
        typeof data.detail === "string" && data.detail.trim()
          ? ` (${data.detail})`
          : "";
      setMessage(`${base}${detail}`);
      return;
    }
    setMessage("A new code has been sent. Check your inbox.");
    setResendCooldown(60);
    if (searchParams.get("hint") === "send-failed") {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("hint");
      const qs = params.toString();
      router.replace(`/verify-email${qs ? `?${qs}` : ""}`, { scroll: false });
    }
  }, [email, router, searchParams]);

  return (
    <AuthLayout>
      <motion.div variants={childVariants} className="lm-auth-card">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15">
            <HiOutlineEnvelope className="h-7 w-7 text-primary" aria-hidden />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-[1.65rem]">
            Verify your email
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {noEmailHint && emailDeliveryConfigured === false
              ? "Enter the 6-digit code (check your server console if email wasn't sent)"
              : sendFailedHint && emailDeliveryConfigured === true
                ? "We couldn't send the first verification email. Use Resend code below, then enter the new code."
                : "Enter the 6-digit code we sent to your inbox"}
          </p>
          {sendFailedHint && emailDeliveryConfigured === true && (
            <div className="mt-3 rounded-xl border border-border/50 bg-muted/30 p-3 text-left text-xs leading-relaxed text-muted-foreground">
              <p>
                Outbound email is configured, but the first send failed (rate limits, sender
                approval, or a temporary mail error). Try{" "}
                <span className="font-semibold text-foreground">Resend code</span>.
              </p>
            </div>
          )}
          {emailDeliveryConfigured === false && (
            <div className="mt-3 rounded-xl border border-warning/30 bg-warning/10 p-3 text-left text-xs leading-relaxed text-muted-foreground">
              <p>
                Email delivery is not configured. Set{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                  NODEMAILER_FROM_EMAIL
                </code>{" "}
                and{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                  NODEMAILER_PASSWORD
                </code>{" "}
                (e.g. Gmail app password).
              </p>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <motion.div variants={childVariants} className="space-y-1.5">
            <AuthEmailInput
              id="ve-email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearField("email");
              }}
              aria-invalid={Boolean(fieldErrors.email)}
              error={Boolean(fieldErrors.email)}
            />
            {fieldErrors.email && (
              <p className="px-0.5 text-sm text-error">{fieldErrors.email}</p>
            )}
          </motion.div>

          {/* OTP Input */}
          <motion.div variants={childVariants} className="space-y-1.5">
            <label className="mb-2 block text-center text-sm font-medium text-foreground">
              Verification code
            </label>
            <OtpInput
              id="ve-code"
              value={code}
              onChange={(val) => {
                setCode(val);
                clearField("code");
              }}
              error={Boolean(fieldErrors.code)}
              disabled={loading}
            />
            {fieldErrors.code && (
              <p className="text-center text-sm text-error">{fieldErrors.code}</p>
            )}
          </motion.div>

          {/* Messages */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm ${
                message.includes("sent") || message.includes("new code")
                  ? "border-success/25 bg-success/10 text-success"
                  : "border-error/25 bg-error/10 text-error"
              }`}
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
                  Verifying…
                </>
              ) : (
                <>
                  Verify email
                  <HiOutlineArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </motion.div>
        </form>

        {/* Footer */}
        <div className="mt-7 flex flex-col gap-3 border-t border-border/50 pt-6 text-center text-sm">
          <button
            type="button"
            disabled={resendLoading || resendCooldown > 0}
            onClick={onResend}
            className="inline-flex items-center justify-center gap-1.5 font-semibold text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline disabled:opacity-50"
          >
            <HiOutlineArrowPath className={`h-3.5 w-3.5 ${resendLoading ? "animate-spin" : ""}`} />
            {resendLoading
              ? "Sending…"
              : resendCooldown > 0
                ? `Resend code (${resendCooldown}s)`
                : "Resend code"}
          </button>
          <Link
            href="/login"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Back to sign in
          </Link>
        </div>
      </motion.div>
    </AuthLayout>
  );
}
