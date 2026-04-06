/** Canonical production origin when `NEXT_PUBLIC_APP_URL` is unset (emails, redirects, webhooks). */
export const DEFAULT_PUBLIC_APP_URL = "https://lucy-merchant.vercel.app";

export function getPublicAppUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const base = raw && raw.length > 0 ? raw : DEFAULT_PUBLIC_APP_URL;
  return base.replace(/\/$/, "");
}
