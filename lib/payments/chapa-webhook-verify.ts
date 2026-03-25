import { createHmac, timingSafeEqual } from "crypto";

/**
 * Chapa signs webhooks with HMAC-SHA256. Prefer the dashboard "secret hash" or
 * encryption key; fall back to the API secret. See:
 * https://developer.chapa.co/integrations/webhooks
 */
export function getChapaWebhookSecret(): string | undefined {
  return (
    process.env.CHAPA_WEBHOOK_SECRET?.trim() ||
    process.env.CHAPA_ENCRYPTION_KEY?.trim() ||
    process.env.CHAPA_SECRET_KEY?.trim()
  );
}

function normalizeSig(s: string): string {
  return s.trim().toLowerCase();
}

function safeEqual(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(normalizeSig(a), "utf8");
    const bb = Buffer.from(normalizeSig(b), "utf8");
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

export function verifyChapaWebhookSignature(
  rawBody: string,
  headerSig: string | null,
): boolean {
  const secret = getChapaWebhookSecret();
  if (!secret || !headerSig) return false;

  const hRaw = createHmac("sha256", secret).update(rawBody).digest("hex");
  if (safeEqual(hRaw, headerSig)) return true;

  try {
    const parsed = JSON.parse(rawBody) as unknown;
    const canonical = JSON.stringify(parsed);
    const hCanon = createHmac("sha256", secret).update(canonical).digest("hex");
    return safeEqual(hCanon, headerSig);
  } catch {
    return false;
  }
}
