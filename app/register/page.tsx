"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  REGISTER,
  registerFieldErrors,
  validateRegisterPayload,
  type RegisterFieldErrors,
} from "@/lib/auth/register-validation";
import { MdBadge, MdLock, MdMail, MdPerson } from "react-icons/md";

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
    <div className="flex min-h-[60vh] flex-1 items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
        className="card w-full max-w-md border border-base-300 bg-base-100 shadow-xl"
      >
        <div className="card-body gap-5">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Claim your seat at the table
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-base-content/70">
              Merchants unlock cart-to-checkout power. Suppliers launch verified
              storefronts. Platform admins provision via the bootstrap API
              (env.example).
            </p>
          </div>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <label className="form-control w-full">
              <div className="label">
                <span className="label-text font-medium">Full name</span>
                {fieldErrors.name ? (
                  <span className="label-text-alt text-error">
                    {fieldErrors.name}
                  </span>
                ) : null}
              </div>
              <label
                className={`input input-bordered flex w-full items-center gap-2 ${fieldErrors.name ? "input-error" : ""}`}
              >
                <MdPerson className="opacity-50" />
                <input
                  name="name"
                  required
                  minLength={REGISTER.nameMin}
                  maxLength={REGISTER.nameMax}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    clearField("name");
                  }}
                  aria-invalid={Boolean(fieldErrors.name)}
                  className="grow"
                  placeholder="Jane Doe"
                />
              </label>
            </label>
            <label className="form-control w-full">
              <div className="label">
                <span className="label-text font-medium">Email</span>
                {fieldErrors.email ? (
                  <span className="label-text-alt text-error">
                    {fieldErrors.email}
                  </span>
                ) : null}
              </div>
              <label
                className={`input input-bordered flex w-full items-center gap-2 ${fieldErrors.email ? "input-error" : ""}`}
              >
                <MdMail className="opacity-50" />
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearField("email");
                  }}
                  aria-invalid={Boolean(fieldErrors.email)}
                  className="grow"
                  placeholder="you@company.com"
                />
              </label>
            </label>
            <label className="form-control w-full">
              <div className="label">
                <span className="label-text font-medium">Password</span>
                {fieldErrors.password ? (
                  <span className="label-text-alt text-error">
                    {fieldErrors.password}
                  </span>
                ) : (
                  <span className="label-text-alt text-base-content/50">
                    {REGISTER.passwordMin}+ chars, one letter and one number
                  </span>
                )}
              </div>
              <label
                className={`input input-bordered flex w-full items-center gap-2 ${fieldErrors.password ? "input-error" : ""}`}
              >
                <MdLock className="opacity-50" />
                <input
                  name="password"
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
                  className="grow"
                  placeholder="Create a strong password"
                />
              </label>
            </label>
            <label className="form-control w-full">
              <div className="label">
                <span className="label-text font-medium">Confirm password</span>
                {fieldErrors.confirmPassword ? (
                  <span className="label-text-alt text-error">
                    {fieldErrors.confirmPassword}
                  </span>
                ) : null}
              </div>
              <label
                className={`input input-bordered flex w-full items-center gap-2 ${fieldErrors.confirmPassword ? "input-error" : ""}`}
              >
                <MdLock className="opacity-50" />
                <input
                  name="confirmPassword"
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
                  className="grow"
                  placeholder="Re-enter password"
                />
              </label>
            </label>
            <fieldset className="form-control">
              <span className="label-text mb-2 font-medium">Role</span>
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
                <label className="label cursor-pointer justify-start gap-3 border border-base-300 rounded-box px-4 py-3 has-[:checked]:border-primary">
                  <input
                    type="radio"
                    name="role"
                    className="radio radio-primary"
                    checked={role === "merchant"}
                    onChange={() => setRole("merchant")}
                  />
                  <span className="flex items-center gap-2">
                    <MdBadge className="text-primary" />
                    Merchant
                  </span>
                </label>
                <label className="label cursor-pointer justify-start gap-3 border border-base-300 rounded-box px-4 py-3 has-[:checked]:border-primary">
                  <input
                    type="radio"
                    name="role"
                    className="radio radio-primary"
                    checked={role === "supplier"}
                    onChange={() => setRole("supplier")}
                  />
                  <span className="flex items-center gap-2">
                    <MdBadge className="text-secondary" />
                    Supplier
                  </span>
                </label>
              </div>
            </fieldset>
            {message && (
              <div role="alert" className="alert alert-error text-sm">
                {message}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm" />
              ) : null}
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
          <p className="text-center text-sm text-base-content/70">
            Already registered?{" "}
            <Link href="/login" className="link link-primary font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
