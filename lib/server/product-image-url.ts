import { isUploadedAssetPath } from "@/lib/server/upload-path";

export const PRODUCT_IMAGE_UPLOAD_SUBDIR = "product-images";

/** Accepts https URLs or same-origin uploaded paths under `product-images`. */
export function normalizeProductImageUrl(raw: string): string | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  if (/^https?:\/\//i.test(t)) return t;
  if (isUploadedAssetPath(t, PRODUCT_IMAGE_UPLOAD_SUBDIR)) return t;
  return undefined;
}
