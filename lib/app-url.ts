/** Canonical production origin when `NEXT_PUBLIC_APP_URL` is unset (emails, redirects, webhooks). */
export const DEFAULT_PUBLIC_APP_URL = "https://lucy-merchant.vercel.app";

function stripEnvQuotes(s: string): string {
  const t = s.trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    return t.slice(1, -1).trim();
  }
  return t;
}

export function getPublicAppUrl(): string {
  const raw = stripEnvQuotes(process.env.NEXT_PUBLIC_APP_URL ?? "");
  const base = raw.length > 0 ? raw : DEFAULT_PUBLIC_APP_URL;
  return base.replace(/\/$/, "");
}

/**
 * Origin used to build the Google OAuth redirect in production (`APP_BASE_URL` + `/api/auth/oauth/google/callback`).
 * Set `APP_BASE_URL` on the server (e.g. Vercel) so it is read at **runtime** — `NEXT_PUBLIC_APP_URL` is inlined
 * at build time and can be wrong if the env was missing or different when you deployed.
 */
export function getOAuthServerBaseUrl(): string {
  const appBase = stripEnvQuotes(process.env.APP_BASE_URL ?? "");
  if (appBase.length > 0) return appBase.replace(/\/$/, "");
  return getPublicAppUrl();
}
