import { readFile } from "fs/promises";
import path from "path";
import { tmpdir } from "os";
import { NextResponse } from "next/server";
import { shouldUseTmpUploads } from "@/lib/server/upload-path";

export const runtime = "nodejs";

const ROOT = path.join(tmpdir(), "lucy-merchant", "uploads");

function contentTypeForPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "image/jpeg";
}

/**
 * Serves uploads written to `/tmp/lucy-merchant/uploads/...` on Vercel (not used locally).
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  if (!shouldUseTmpUploads()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { path: segments } = await context.params;
  if (!segments?.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const safe = segments.filter((s) => s && s !== ".." && !s.includes("/"));
  if (safe.length !== segments.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const full = path.join(ROOT, ...safe);
  const rel = path.relative(ROOT, full);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const buf = await readFile(full);
    return new NextResponse(buf, {
      headers: {
        "Content-Type": contentTypeForPath(full),
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
