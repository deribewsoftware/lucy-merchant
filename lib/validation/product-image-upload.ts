export const PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED = new Map<string, number>([
  [".jpg", PRODUCT_IMAGE_MAX_BYTES],
  [".jpeg", PRODUCT_IMAGE_MAX_BYTES],
  [".png", PRODUCT_IMAGE_MAX_BYTES],
  [".webp", PRODUCT_IMAGE_MAX_BYTES],
]);

export function productImageExtension(filename: string): string {
  const lower = filename.trim().toLowerCase();
  const i = lower.lastIndexOf(".");
  return i >= 0 ? lower.slice(i) : "";
}

export function validateProductImageFile(
  file: File,
): { ok: true } | { ok: false; error: string } {
  const ext = productImageExtension(file.name);
  const max = ALLOWED.get(ext);
  if (max == null) {
    return { ok: false, error: "Use a JPG, PNG, or WebP image." };
  }
  if (file.size > max) {
    return { ok: false, error: "Image is too large (max 5MB)." };
  }
  return { ok: true };
}
