import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";
import {
  AUTH_SECRET_MIN_LENGTH,
  resolveAuthSecretFromEnv,
} from "./lib/auth/auth-secret-requirements";

// Ensure `.env*` are merged before reading AUTH_SECRET (e.g. after `vercel env pull` before local `vercel build`).
loadEnvConfig(process.cwd(), process.env.NODE_ENV === "development");

/**
 * Edge/proxy may not see plain `process.env.AUTH_SECRET`; `compiler.defineServer` inlines it for those bundles.
 * Never inject an empty string: that replaces real runtime env for Node route handlers (e.g. presence API).
 */
const authSecretForServerBundles = resolveAuthSecretFromEnv() ?? "";

// Do not throw here: runtime auth uses `getJwtSecretKey`; Vercel env may only be visible at runtime.
if (
  process.env.VERCEL === "1" &&
  authSecretForServerBundles.length < AUTH_SECRET_MIN_LENGTH
) {
  // May log more than once when Next runs the config in multiple workers.
  console.warn(
    "[next.config] AUTH_SECRET / NEXTAUTH_SECRET missing or <32 chars at build time. " +
      "Production auth will fail until you set AUTH_SECRET (≥32 chars) in Vercel or env."
  );
}

const nextConfig: NextConfig = {
  ...(authSecretForServerBundles.length >= AUTH_SECRET_MIN_LENGTH
    ? {
        compiler: {
          defineServer: {
            "process.env.AUTH_SECRET": JSON.stringify(authSecretForServerBundles),
          },
        },
      }
    : {}),
};

export default nextConfig;
