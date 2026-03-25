import { mkdir, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { isEphemeralServerHost } from "@/lib/server/ephemeral-host";

/**
 * Use `/tmp` + `/api/uploads/...` instead of `public/uploads` (read-only on serverless).
 * Override: `LUCY_UPLOADS_TO_TMP=1` | `0`
 */
export function useTmpForUploads(): boolean {
  if (process.env.LUCY_UPLOADS_TO_TMP === "1") return true;
  if (process.env.LUCY_UPLOADS_TO_TMP === "0") return false;
  return isEphemeralServerHost();
}

/** Public URL prefixes for a folder under `uploads/` (static vs API-served). */
export function uploadPublicPathPrefixes(subdir: string): [string, string] {
  return [`/uploads/${subdir}/`, `/api/uploads/${subdir}/`];
}

/** Validates a client-supplied path for an uploaded file (relative, same-origin). */
export function isUploadedAssetPath(url: string, subdir: string): boolean {
  const trimmed = url.trim();
  return (
    uploadPublicPathPrefixes(subdir).some((p) => trimmed.startsWith(p)) &&
    !trimmed.includes("..") &&
    trimmed.length < 500
  );
}

/**
 * Local: files live under `public/uploads/...` and are served as static assets.
 * Serverless: `public` is read-only; writes go to `/tmp/...` and are served via `/api/uploads/...`.
 */
export function getUploadTarget(subdir: string): {
  dir: string;
  /** Prefix for URLs stored on orders (e.g. `/uploads/foo` or `/api/uploads/foo`) */
  urlPrefix: string;
} {
  if (useTmpForUploads()) {
    const dir = path.join(tmpdir(), "lucy-merchant", "uploads", subdir);
    return { dir, urlPrefix: `/api/uploads/${subdir}` };
  }
  const dir = path.join(process.cwd(), "public", "uploads", subdir);
  return { dir, urlPrefix: `/uploads/${subdir}` };
}

/** Writes bytes to the configured upload directory; never throws (returns `{ ok: false }`). */
export async function writeBufferToUpload(
  subdir: string,
  filename: string,
  body: Buffer,
): Promise<{ ok: true; publicPath: string } | { ok: false; error: string }> {
  const { dir, urlPrefix } = getUploadTarget(subdir);
  try {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), body);
  } catch (e) {
    console.error("[upload]", subdir, filename, e);
    return { ok: false, error: "Could not save file on this server" };
  }
  return { ok: true, publicPath: `${urlPrefix}/${filename}` };
}
