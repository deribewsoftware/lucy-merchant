import {
  authSecretMissingMessage,
  resolveAuthSecretFromEnv,
} from "@/lib/auth/auth-secret-requirements";

/** Dynamic lookup avoids accidental empty inlining of `process.env.AUTH_SECRET` in some server bundles. */
export function getJwtSecretKey(): Uint8Array {
  const s = resolveAuthSecretFromEnv();
  if (s) {
    return new TextEncoder().encode(s);
  }
  if (process.env.NODE_ENV === "development") {
    return new TextEncoder().encode("dev-secret-must-be-at-least-32-chars");
  }
  throw new Error(`[auth] ${authSecretMissingMessage()}`);
}
