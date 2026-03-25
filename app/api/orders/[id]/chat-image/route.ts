import path from "path";
import { NextResponse } from "next/server";
import { writeBufferToUpload } from "@/lib/server/upload-path";
import { getOrder } from "@/lib/db/commerce";
import { canAccessOrder } from "@/lib/server/order-access";
import { requireSession } from "@/lib/server/require-session";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

const ALLOWED = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

export async function POST(request: Request, context: Params) {
  const auth = await requireSession(["merchant", "supplier", "admin"]);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const order = getOrder(id);
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!canAccessOrder(auth.user, order)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (
    (order.status === "awaiting_payment" ||
      order.status === "awaiting_bank_review") &&
    auth.user.role !== "admin"
  ) {
    return NextResponse.json(
      { error: "Chat opens after payment is confirmed." },
      { status: 400 },
    );
  }

  if (order.status === "rejected" || order.status === "completed") {
    return NextResponse.json(
      { error: "Chat is closed for this order" },
      { status: 400 },
    );
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (file.size > 4 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Image too large (max 4MB)" },
      { status: 400 },
    );
  }

  const origName =
    typeof (file as { name?: string }).name === "string"
      ? (file as { name: string }).name
      : "photo.jpg";
  const ext = path.extname(origName).toLowerCase() || ".jpg";
  if (!ALLOWED.has(ext)) {
    return NextResponse.json(
      { error: "Use JPG, PNG, WebP, or GIF" },
      { status: 400 },
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const filename = `${id}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`;
  const saved = await writeBufferToUpload("order-chat", filename, buf);
  if (!saved.ok) {
    return NextResponse.json({ error: saved.error }, { status: 500 });
  }
  return NextResponse.json({ url: saved.publicPath });
}
