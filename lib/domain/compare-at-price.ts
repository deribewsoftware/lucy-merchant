/**
 * Optional “list” / was price. Only stored when strictly greater than the unit sale `price`.
 */
export function normalizeCompareAtPrice(
  unitPrice: number,
  raw: unknown,
): number | undefined {
  if (raw === undefined || raw === null || raw === "") return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  if (n <= unitPrice) return undefined;
  return Math.round(n * 100) / 100;
}

export function hasDiscountPrice(
  price: number,
  compareAtPrice?: number | null,
): compareAtPrice is number {
  return (
    compareAtPrice != null &&
    Number.isFinite(compareAtPrice) &&
    Number.isFinite(price) &&
    compareAtPrice > price
  );
}
