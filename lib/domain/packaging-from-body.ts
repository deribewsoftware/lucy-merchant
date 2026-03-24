import type { Product } from "@/lib/domain/types";

const KEYS = ["itemsPerCarton", "itemsPerRim", "itemsPerDozen"] as const;

export type ProductPackagingKey = (typeof KEYS)[number];

export function packagingForCreate(
  body: unknown,
): Partial<Pick<Product, ProductPackagingKey>> {
  const b = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const out: Partial<Pick<Product, ProductPackagingKey>> = {};
  for (const key of KEYS) {
    const v = b[key];
    if (v === undefined || v === null || v === "") continue;
    const n = Number(v);
    if (Number.isFinite(n) && n >= 1) out[key] = Math.floor(n);
  }
  return out;
}

/** Merge packaging fields from PATCH body; omitted keys keep existing values. */
export function packagingFromPatch(
  body: Record<string, unknown>,
  existing: Product,
): Pick<Product, ProductPackagingKey> {
  const read = (key: ProductPackagingKey): number | undefined => {
    if (!(key in body)) return existing[key];
    const v = body[key];
    if (v === null || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : undefined;
  };
  return {
    itemsPerCarton: read("itemsPerCarton"),
    itemsPerRim: read("itemsPerRim"),
    itemsPerDozen: read("itemsPerDozen"),
  };
}
