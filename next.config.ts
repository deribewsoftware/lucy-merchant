import type { NextConfig } from "next";

/**
 * JWT signing uses runtime `AUTH_SECRET` / `NEXTAUTH_SECRET` only (see `lib/auth/auth-secret-requirements.ts`).
 * Do not use `compiler.defineServer` for those — inlining can disagree with Vercel/runtime env and break auth.
 */
const nextConfig: NextConfig = {
  /** Avoid bundling Nodemailer into route chunks (SMTP / TLS / DNS behave correctly at runtime). */
  serverExternalPackages: ["nodemailer"],
};

export default nextConfig;
