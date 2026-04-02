import { AUTH_SECRET_MIN_LENGTH } from "@/auth-secret-constants";

export { AUTH_SECRET_MIN_LENGTH };

const vercelHint =
  "In Vercel: Project → Settings → Environment Variables → add AUTH_SECRET or NEXTAUTH_SECRET, " +
  "enable Production and Preview, then redeploy. Generate e.g. openssl rand -base64 32";

/** Shown when the secret is missing or too short in production (Vercel, etc.). */
export function authSecretMissingMessage(): string {
  const auth = process.env.AUTH_SECRET;
  const nextAuth = process.env.NEXTAUTH_SECRET;
  if (typeof auth === "string") {
    const t = auth.trim();
    if (t.length > 0 && t.length < AUTH_SECRET_MIN_LENGTH) {
      return (
        `AUTH_SECRET is only ${t.length} characters after trim (minimum ${AUTH_SECRET_MIN_LENGTH}). ` +
          `${vercelHint}`
      );
    }
  }
  if (typeof nextAuth === "string") {
    const t = nextAuth.trim();
    if (t.length > 0 && t.length < AUTH_SECRET_MIN_LENGTH) {
      return (
        `NEXTAUTH_SECRET is only ${t.length} characters after trim (minimum ${AUTH_SECRET_MIN_LENGTH}). ` +
          `${vercelHint}`
      );
    }
  }
  return (
    "AUTH_SECRET must be set (min 32 characters) in production. " + vercelHint
  );
}

/**
 * Single source of truth for JWT signing: prefer `AUTH_SECRET`, then `NEXTAUTH_SECRET`,
 * only if trimmed length >= {@link AUTH_SECRET_MIN_LENGTH}.
 * Use this in `next.config` (defineServer) and `getJwtSecretKey` so build/runtime never disagree.
 */
export function resolveAuthSecretFromEnv(): string | undefined {
  const auth = process.env.AUTH_SECRET;
  if (typeof auth === "string") {
    const t = auth.trim();
    if (t.length >= AUTH_SECRET_MIN_LENGTH) return t;
  }
  const nextAuth = process.env.NEXTAUTH_SECRET;
  if (typeof nextAuth === "string") {
    const t = nextAuth.trim();
    if (t.length >= AUTH_SECRET_MIN_LENGTH) return t;
  }
  return undefined;
}
