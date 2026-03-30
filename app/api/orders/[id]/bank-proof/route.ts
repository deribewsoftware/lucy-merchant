import path from "path";
import { NextResponse } from "next/server";
import { writeBufferToUpload } from "@/lib/server/upload-path";
import { getOrder, patchOrder } from "@/lib/db/commerce";
import {
  notifyAdminsBankProofSubmitted,
  notifyAdminsBankReceiptOnPendingOrder,
  notifyMerchantBankProofUploaded,
  notifySuppliersBuyerBankReceiptUploaded,
} from "@/lib/db/notifications";
import { requireSession } from "@/lib/server/require-session";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

const ALLOWED = new Set([".jpg", ".jpeg", ".png", ".webp"]);

export async function POST(request: Request, context: Params) {
  const auth = await requireSession(["merchant"]);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const order = getOrder(id);
  if (!order || order.merchantId !== auth.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (order.paymentMethod !== "bank_transfer") {
    return NextResponse.json({ error: "Not a bank transfer order" }, { status: 400 });
  }

  const legacyAwaiting = order.status === "awaiting_payment";
  const newFlowPending =
    order.status === "pending" && order.paymentMethod === "bank_transfer";

  if (!legacyAwaiting && !newFlowPending) {
    return NextResponse.json(
      { error: "Proof cannot be uploaded for this order state" },
      { status: 400 },
    );
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }

  const origName =
    typeof (file as { name?: string }).name === "string"
      ? (file as { name: string }).name
      : "receipt.jpg";
  const ext = path.extname(origName).toLowerCase() || ".jpg";
  if (!ALLOWED.has(ext)) {
    return NextResponse.json(
      { error: "Use JPG, PNG, or WebP" },
      { status: 400 },
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const filename = `${id}-${Date.now()}${ext}`;
  const saved = await writeBufferToUpload("order-receipts", filename, buf);
  if (!saved.ok) {
    return NextResponse.json({ error: saved.error }, { status: 500 });
  }
  const publicPath = saved.publicPath;
  const hadProof = Boolean(order.bankProofImagePath);

  if (legacyAwaiting) {
    const updated = patchOrder(id, {
      bankProofImagePath: publicPath,
      status: "awaiting_bank_review",
    });
    if (updated) {
      notifyAdminsBankProofSubmitted(updated);
      notifyMerchantBankProofUploaded(updated, "submitted_for_review");
    }
    return NextResponse.json({ ok: true, order: updated, imagePath: publicPath });
  }

  const updated = patchOrder(id, {
    bankProofImagePath: publicPath,
  });
  if (updated) {
    notifyMerchantBankProofUploaded(
      updated,
      hadProof ? "receipt_updated" : "receipt_saved_pending",
    );
    if (!hadProof) {
      notifySuppliersBuyerBankReceiptUploaded(updated);
      notifyAdminsBankReceiptOnPendingOrder(updated);
    }
  }
  return NextResponse.json({ ok: true, order: updated, imagePath: publicPath });
}
