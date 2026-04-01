import type { NextConfig } from "next";
import {
  AUTH_SECRET_MIN_LENGTH,
  authSecretMissingMessage,
  resolveAuthSecretFromEnv,
} from "./lib/auth/auth-secret-requirements";

/**
 * Edge/proxy may not see plain `process.env.AUTH_SECRET`; `compiler.defineServer` inlines it for those bundles.
 * Never inject an empty string: that replaces real runtime env for Node route handlers (e.g. presence API).
 */
const authSecretForServerBundles = resolveAuthSecretFromEnv() ?? "";

/** Fail Vercel builds early if auth secret is missing (avoids deploying a broken app). */
if (
  process.env.VERCEL === "1" &&
  authSecretForServerBundles.length < AUTH_SECRET_MIN_LENGTH
) {
  throw new Error(authSecretMissingMessage());
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
