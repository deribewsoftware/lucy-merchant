import { mkdir, writeFile } from "fs/promises";
import path from "path";

const ALLOWED = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

export async function saveCommissionProofImage(
  orderId: string,
  file: Blob,
  origName: string,
): Promise<{ ok: true; publicPath: string } | { ok: false; error: string }> {
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "File too large (max 5MB)" };
  }
  const ext = path.extname(origName).toLowerCase() || ".jpg";
  if (!ALLOWED.has(ext)) {
    return { ok: false, error: "Use JPG, PNG, or WebP" };
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const dir = path.join(process.cwd(), "public", "uploads", "commission-proofs");
  await mkdir(dir, { recursive: true });
  const filename = `${orderId}-${Date.now()}${ext}`;
  await writeFile(path.join(dir, filename), buf);
  return { ok: true, publicPath: `/uploads/commission-proofs/${filename}` };
}
