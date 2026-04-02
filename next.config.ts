import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";
import { resolveAuthSecretFromEnv } from "./lib/auth/auth-secret-requirements";

loadEnvConfig(process.cwd(), process.env.NODE_ENV === "development");

/**
 * When `resolveAuthSecretFromEnv()` returns a value (≥32 chars), inline it for bundles that
 * may not see `process.env.AUTH_SECRET` at build time. If unset at build (e.g. Vercel injects
 * only at runtime), skip — `getJwtSecretKey` reads env when auth runs. Never throw.
 */
const authSecretAtBuild = resolveAuthSecretFromEnv();
const nextConfig: NextConfig = {
  ...(authSecretAtBuild
    ? {
        compiler: {
          defineServer: {
            "process.env.AUTH_SECRET": JSON.stringify(authSecretAtBuild),
          },
        },
      }
    : {}),
};

export default nextConfig;
