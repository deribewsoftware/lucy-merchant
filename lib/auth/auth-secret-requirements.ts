/** Minimum length for `AUTH_SECRET` / `NEXTAUTH_SECRET` after trim. */
export const AUTH_SECRET_MIN_LENGTH = 32;

/** Shown when the secret is missing or too short in production (Vercel, etc.). */
export function authSecretMissingMessage(): string {
  return (
    "AUTH_SECRET must be set (min 32 characters) in production. " +
      "In Vercel: Project → Settings → Environment Variables → add AUTH_SECRET or NEXTAUTH_SECRET, " +
      "enable Production and Preview, then redeploy. Generate e.g. openssl rand -base64 32"
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
