import { AUTH_SECRET_MIN_LENGTH } from "./auth-secret-constants";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

/**
 * Read JWT signing secret for optional `defineServer` inlining only.
 *
 * Do not import from `./lib/**` here — only `./auth-secret-constants` (no app logic).
 * Env names and rules match `resolveAuthSecretFromEnv` in `lib/auth/auth-secret-requirements.ts`.
 */
function readAuthSecretForNextConfig(): string | undefined {
  const a = process.env.AUTH_SECRET;
  if (typeof a === "string") {
    const t = a.trim();
    if (t.length >= AUTH_SECRET_MIN_LENGTH) return t;
  }
  const n = process.env.NEXTAUTH_SECRET;
  if (typeof n === "string") {
    const t = n.trim();
    if (t.length >= AUTH_SECRET_MIN_LENGTH) return t;
  }
  return undefined;
}

loadEnvConfig(process.cwd(), process.env.NODE_ENV === "development");

const authSecretAtBuild = readAuthSecretForNextConfig();

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
