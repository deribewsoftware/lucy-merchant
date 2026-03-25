/**
 * Telebirr merchant integration is environment-specific (Ethio Telecom APIs).
 * Set TELEBIRR_CHECKOUT_URL to a full HTTPS URL that starts the wallet flow for the cart,
 * or implement server-side init here later.
 */
export function getTelebirrCheckoutUrl(orderIds: string[]): string | null {
  const base = process.env.TELEBIRR_CHECKOUT_URL?.trim();
  if (!base) return null;
  const u = new URL(base);
  u.searchParams.set("order_ids", orderIds.join(","));
  return u.toString();
}
