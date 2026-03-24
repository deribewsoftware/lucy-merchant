"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import { MdLock, MdMail } from "react-icons/md";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";
  const err = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(
    err === "forbidden" ? "You do not have access to that area." : null,
  );
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error ?? "Login failed");
      return;
    }
    const role = data.user?.role as string;
    const fallback =
      role === "admin"
        ? "/admin/dashboard"
        : role === "supplier"
          ? "/supplier/dashboard"
          : "/merchant/dashboard";
    router.push(next && next.startsWith("/") ? next : fallback);
    router.refresh();
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
              Welcome back
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-base-content/70">
              Secure JWT session, HTTP-only cookie, instant routing to your
              merchant, supplier, or admin command center.
            </p>
          </div>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <label className="form-control w-full">
              <span className="label-text font-medium">Email</span>
              <label className="input input-bordered flex w-full items-center gap-2">
                <MdMail className="opacity-50" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="grow"
                  placeholder="you@company.com"
                />
              </label>
            </label>
            <label className="form-control w-full">
              <span className="label-text font-medium">Password</span>
              <label className="input input-bordered flex w-full items-center gap-2">
                <MdLock className="opacity-50" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="grow"
                  placeholder="••••••••"
                />
              </label>
            </label>
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
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <p className="text-center text-sm text-base-content/70">
            No account?{" "}
            <Link href="/register" className="link link-primary font-medium">
              Register as merchant or supplier
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
