"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Lock,
  Mail,
  ShoppingBag,
  Sparkles,
  User,
} from "lucide-react";
import {
  REGISTER,
  registerFieldErrors,
  validateRegisterPayload,
  type RegisterFieldErrors,
} from "@/lib/auth/register-validation";
import { brandCopy } from "@/lib/brand/copy";

type Role = "merchant" | "supplier";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<Role>("merchant");
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

    const payload = { name, email, password, confirmPassword };
    const msg = validateRegisterPayload(payload);
    if (msg) {
      setMessage(msg);
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
    router.push("/login");
  }

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-1 items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/25">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl font-bold text-foreground">
              {brandCopy.name}
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="lm-card">
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Join as a merchant or supplier
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            {/* Name Field */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-foreground">
                Full name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
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
                  className={`lm-input pl-11 ${fieldErrors.name ? "border-destructive focus:border-destructive focus:ring-destructive/20" : ""}`}
                  placeholder="Jane Doe"
                />
              </div>
              {fieldErrors.name && (
                <p className="text-sm text-destructive">{fieldErrors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearField("email");
                  }}
                  aria-invalid={Boolean(fieldErrors.email)}
                  className={`lm-input pl-11 ${fieldErrors.email ? "border-destructive focus:border-destructive focus:ring-destructive/20" : ""}`}
                  placeholder="you@company.com"
                />
              </div>
              {fieldErrors.email && (
                <p className="text-sm text-destructive">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <span className="text-xs text-muted-foreground">
                  {REGISTER.passwordMin}+ chars, letter & number
                </span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="password"
                  type="password"
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
                  className={`lm-input pl-11 ${fieldErrors.password ? "border-destructive focus:border-destructive focus:ring-destructive/20" : ""}`}
                  placeholder="Create a strong password"
                />
              </div>
              {fieldErrors.password && (
                <p className="text-sm text-destructive">{fieldErrors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="confirmPassword"
                  type="password"
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
                  className={`lm-input pl-11 ${fieldErrors.confirmPassword ? "border-destructive focus:border-destructive focus:ring-destructive/20" : ""}`}
                  placeholder="Re-enter your password"
                />
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-sm text-destructive">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            {/* Role Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                I want to join as
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("merchant")}
                  className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-all ${
                    role === "merchant"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-muted"
                  }`}
                >
                  <ShoppingBag className="h-6 w-6" />
                  <span className="text-sm font-medium">Merchant</span>
                  <span className="text-xs opacity-70">Buy products</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("supplier")}
                  className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-all ${
                    role === "supplier"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-muted"
                  }`}
                >
                  <Building2 className="h-6 w-6" />
                  <span className="text-sm font-medium">Supplier</span>
                  <span className="text-xs opacity-70">Sell products</span>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                {message}
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-primary transition-colors hover:text-primary/80"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Security Badge */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Lock className="mb-0.5 mr-1 inline h-3 w-3" />
          Your data is encrypted and secure
        </p>
      </motion.div>
    </div>
  );
}
