import {
  authSecretMissingMessage,
  resolveAuthSecretFromEnv,
} from "@/lib/auth/auth-secret-requirements";

/** Resolves secret via `resolveAuthSecretFromEnv` (dynamic `process.env[...]` reads). */
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
