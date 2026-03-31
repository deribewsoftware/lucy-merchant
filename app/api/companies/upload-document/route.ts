import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import {
  companyDocumentExtension,
  validateCompanyDocumentFile,
} from "@/lib/validation/company-document-upload";
import { requireSession } from "@/lib/server/require-session";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { writeBufferToUpload } from "@/lib/server/upload-path";

export const runtime = "nodejs";

const SUBDIR = "company-docs";

export async function POST(request: Request) {
  const auth = await requireSession(["supplier"]);
  if (!auth.ok) return auth.response;

  const rl = checkRateLimit(`company-doc:${auth.user.id}`, 25, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many uploads. Retry in ${rl.retryAfterSec}s` },
      { status: 429 },
    );
  }

  const ct = request.headers.get("content-type") ?? "";
  if (!ct.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const asFile = file as File;
  const check = validateCompanyDocumentFile(asFile);
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: 400 });
  }

  const buf = Buffer.from(await asFile.arrayBuffer());
  const ext = companyDocumentExtension(asFile.name) || ".bin";
  const safeExt = /^\.(jpe?g|png|webp|pdf)$/i.test(ext) ? ext.toLowerCase() : ".bin";
  const filename = `${auth.user.id.slice(0, 8)}-${randomUUID()}${safeExt}`;

  const written = await writeBufferToUpload(SUBDIR, filename, buf);
  if (!written.ok) {
    return NextResponse.json({ error: written.error }, { status: 500 });
  }

  return NextResponse.json({ url: written.publicPath });
}
