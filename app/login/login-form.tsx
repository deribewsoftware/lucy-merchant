"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
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
import { loginFieldErrors, type LoginFieldErrors } from "@/lib/auth/login-validation";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";
  const err = searchParams.get("error");
  const verified = searchParams.get("verified");
  const reset = searchParams.get("reset");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [message, setMessage] = useState<string | null>(() => {
    if (err === "forbidden") return "You do not have access to that area.";
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
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      if (res.status === 403 && data.code === "EMAIL_NOT_VERIFIED") {
        setVerifyLinkEmail(email);
        setMessage(data.error ?? "Verify your email before signing in.");
        return;
      }
      setVerifyLinkEmail(null);
      setMessage(data.error ?? "Login failed");
      return;
    }
    setVerifyLinkEmail(null);
    const role = data.user?.role as string;
    const fallback =
      role === "admin"
        ? "/admin/dashboard"
        : role === "supplier"
          ? "/supplier/dashboard"
          : "/merchant/dashboard";
    window.dispatchEvent(new CustomEvent(LM_LOGIN_EVENT));
    router.push(next && next.startsWith("/") ? next : fallback);
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
          <SocialAuthButtons mode="login" />
        </div>

        {/* Success banner */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-start gap-2.5 rounded-xl border border-success/25 bg-success/10 px-3.5 py-3 text-sm text-success"
          >
            <HiOutlineCheckCircle className="mt-0.5 h-4.5 w-4.5 shrink-0" aria-hidden />
            {successMessage}
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
