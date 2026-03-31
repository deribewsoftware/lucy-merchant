export const COMPANY_DOC_MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const COMPANY_DOC_MAX_PDF_BYTES = 12 * 1024 * 1024;

const ALLOWED = new Map<string, number>([
  [".jpg", COMPANY_DOC_MAX_IMAGE_BYTES],
  [".jpeg", COMPANY_DOC_MAX_IMAGE_BYTES],
  [".png", COMPANY_DOC_MAX_IMAGE_BYTES],
  [".webp", COMPANY_DOC_MAX_IMAGE_BYTES],
  [".pdf", COMPANY_DOC_MAX_PDF_BYTES],
]);

export function companyDocumentExtension(filename: string): string {
  const lower = filename.trim().toLowerCase();
  const i = lower.lastIndexOf(".");
  return i >= 0 ? lower.slice(i) : "";
}

export function validateCompanyDocumentFile(
  file: File,
): { ok: true } | { ok: false; error: string } {
  const ext = companyDocumentExtension(file.name);
  const max = ALLOWED.get(ext);
  if (max == null) {
    return { ok: false, error: "Use a JPG, PNG, WebP, or PDF file." };
  }
  if (file.size > max) {
    const mb = Math.round(max / (1024 * 1024));
    return { ok: false, error: `File is too large (max ${mb}MB for this type).` };
  }
  return { ok: true };
}
