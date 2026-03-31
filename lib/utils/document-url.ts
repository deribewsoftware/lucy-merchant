const IMAGE_EXT = /\.(jpe?g|png|gif|webp|avif)(\?|#|$)/i;
const PDF_EXT = /\.pdf(\?|#|$)/i;

function pathLooksImage(u: string): boolean {
  return IMAGE_EXT.test(u);
}

function pathLooksPdf(u: string): boolean {
  return PDF_EXT.test(u);
}

/** Heuristic for inline image preview (https URLs or same-origin upload paths). */
export function isLikelyPublicImageUrl(url: string): boolean {
  const u = url.trim();
  if (/^https?:\/\//i.test(u)) return pathLooksImage(u);
  if (u.startsWith("/api/uploads/") || u.startsWith("/uploads/")) {
    return pathLooksImage(u);
  }
  return false;
}

export function isLikelyPdfUrl(url: string): boolean {
  const u = url.trim();
  if (/^https?:\/\//i.test(u)) return pathLooksPdf(u);
  if (u.startsWith("/api/uploads/") || u.startsWith("/uploads/")) {
    return pathLooksPdf(u);
  }
  return false;
}
