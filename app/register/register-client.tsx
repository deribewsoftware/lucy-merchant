"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  HiOutlineArrowRight,
  HiOutlineExclamationCircle,
  HiOutlineUserPlus,
  HiOutlineUser,
  HiOutlineShoppingBag,
  HiOutlineBuildingOffice2,
} from "react-icons/hi2";
import AuthLayout, { childVariants } from "@/components/auth/AuthLayout";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";
import PasswordStrengthMeter from "@/components/auth/PasswordStrengthMeter";
import {
  AuthEmailInput,
  AuthLeadingIconInput,
  AuthPasswordInput,
} from "@/components/auth-credential-inputs";
import {
  REGISTER,
  registerFieldErrors,
  validateRegisterPayload,
  type RegisterFieldErrors,
} from "@/lib/auth/register-validation";

type Role = "merchant" | "supplier";

export default function RegisterClient({ googleOAuthConfigured }: { googleOAuthConfigured: boolean }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<Role>("merchant");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [loading, setLoading] = useState(false);

  function clearField<K extends keyof RegisterFieldErrors>(key: K) {
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

    if (!agreedToTerms) {
      setMessage("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }

    const payload = { name, email, password, confirmPassword };
    const msg = validateRegisterPayload(payload);
    if (msg) {
      setFieldErrors(registerFieldErrors(payload));
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password,
        confirmPassword,
        role,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error ?? "Registration failed");
      return;
    }
    if (data.needsVerification) {
      const q = new URLSearchParams({ email });
      if (data.emailSent === false) {
        q.set("hint", data.emailSendFailed ? "send-failed" : "no-email");
      }
      router.push(`/verify-email?${q.toString()}`);
      return;
    }
    router.push("/login");
  }

  return (
    <AuthLayout>
      <motion.div variants={childVariants} className="lm-auth-card">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15">
            <HiOutlineUserPlus className="h-7 w-7 text-primary" aria-hidden />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-[1.65rem]">
            Create your account
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Join as a merchant or supplier — it&apos;s free
          </p>
        </div>

        {/* Social auth — no Suspense here; register SocialAuthButtons avoids useSearchParams */}
        <div className="mt-7">
          <SocialAuthButtons
            mode="register"
            oauthRole={role}
            googleOAuthConfigured={googleOAuthConfigured}
          />
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          {/* Name */}
          <motion.div variants={childVariants} className="space-y-1.5">
            <AuthLeadingIconInput
              Icon={HiOutlineUser}
              label="Full name"
              id="name"
              required
              minLength={REGISTER.nameMin}
              maxLength={REGISTER.nameMax}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearField("name");
              }}
              aria-invalid={Boolean(fieldErrors.name)}
              error={Boolean(fieldErrors.name)}
              autoComplete="name"
            />
            {fieldErrors.name && (
              <p className="px-0.5 text-sm text-error">{fieldErrors.name}</p>
            )}
          </motion.div>

          {/* Email */}
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

          {/* Password */}
          <motion.div variants={childVariants} className="space-y-1.5">
            <AuthPasswordInput
              id="password"
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
              label="Password"
            />
            <PasswordStrengthMeter password={password} />
            {fieldErrors.password && (
              <p className="px-0.5 text-sm text-error">{fieldErrors.password}</p>
            )}
          </motion.div>

          {/* Confirm Password */}
          <motion.div variants={childVariants} className="space-y-1.5">
            <AuthPasswordInput
              id="confirmPassword"
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
              label="Confirm password"
              toggleLabels={{ show: "Show confirm password", hide: "Hide confirm password" }}
            />
            {confirmPassword && password && password === confirmPassword && (
              <p className="px-0.5 text-[11px] font-medium text-success">
                ✓ Passwords match
              </p>
            )}
            {fieldErrors.confirmPassword && (
              <p className="px-0.5 text-sm text-error">{fieldErrors.confirmPassword}</p>
            )}
          </motion.div>

          {/* Role selector */}
          <motion.div variants={childVariants} className="space-y-3">
            <p className="text-sm font-medium text-foreground">I want to join as</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("merchant")}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all duration-200 ${
                  role === "merchant"
                    ? "border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                    : "border-border bg-card text-muted-foreground hover:border-primary/35 hover:bg-muted/50"
                }`}
              >
                <HiOutlineShoppingBag className="h-6 w-6" aria-hidden />
                <span className="text-sm font-semibold">Merchant</span>
                <span className="text-xs opacity-80">Buy products</span>
              </button>
              <button
                type="button"
                onClick={() => setRole("supplier")}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all duration-200 ${
                  role === "supplier"
                    ? "border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                    : "border-border bg-card text-muted-foreground hover:border-primary/35 hover:bg-muted/50"
                }`}
              >
                <HiOutlineBuildingOffice2 className="h-6 w-6" aria-hidden />
                <span className="text-sm font-semibold">Supplier</span>
                <span className="text-xs opacity-80">Sell products</span>
              </button>
            </div>
          </motion.div>

          {/* Terms */}
          <motion.div variants={childVariants}>
            <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-base-300 text-primary focus:ring-primary/30"
              />
              <span>
                I agree to the{" "}
                <Link href="/terms" className="font-medium text-primary underline-offset-4 hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="font-medium text-primary underline-offset-4 hover:underline">
                  Privacy Policy
                </Link>
              </span>
            </label>
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
                  Creating account…
                </>
              ) : (
                <>
                  Create account
                  <HiOutlineArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </motion.div>
        </form>

        {/* Footer */}
        <div className="mt-7 border-t border-border/50 pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </AuthLayout>
  );
}
