import { NextResponse } from "next/server";
import { companiesByOwner } from "@/lib/db/catalog";
import { getOrder } from "@/lib/db/commerce";
import { isSingleSupplierOrder } from "@/lib/domain/order-split";
import { recordSupplierPlatformCommission } from "@/lib/payments/record-platform-commission";
import { saveCommissionProofImage } from "@/lib/server/commission-proof-upload";
import { requireSession } from "@/lib/server/require-session";
import { checkRateLimit, clientIp } from "@/lib/server/rate-limit";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/** Supplier records supplier → platform commission; requires payment proof image (multipart). Admin may POST without file. */
export async function POST(request: Request, context: Params) {
  const auth = await requireSession(["supplier", "admin"]);
  if (!auth.ok) return auth.response;

  const ip = clientIp(request);
  const rl = checkRateLimit(
    `supplier-commission:${auth.user.id}:${ip}`,
    8,
    15 * 60 * 1000,
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many attempts. Retry in ${rl.retryAfterSec}s` },
      { status: 429 },
    );
  }

  const { id } = await context.params;
  const order = getOrder(id);
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (auth.user.role === "supplier") {
    if (!isSingleSupplierOrder(order)) {
      return NextResponse.json(
        { error: "Multi-supplier orders are not supported for this action" },
        { status: 400 },
      );
    }
    const mine = new Set(companiesByOwner(auth.user.id).map((c) => c.id));
    const supplierCompanyId = order.items[0]?.companyId;
    if (!supplierCompanyId || !mine.has(supplierCompanyId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const ct = request.headers.get("content-type") ?? "";
  let proofImagePath: string | undefined;

  if (ct.includes("multipart/form-data")) {
    const form = await request.formData().catch(() => null);
    const file = form?.get("proof");
    if (auth.user.role === "supplier") {
      if (!file || !(file instanceof Blob) || file.size === 0) {
        return NextResponse.json(
          {
            error:
              "Attach a payment screenshot or receipt (JPG, PNG, or WebP, max 5MB).",
          },
          { status: 400 },
        );
      }
      const origName =
        typeof (file as File).name === "string"
          ? (file as File).name
          : "receipt.jpg";
      const saved = await saveCommissionProofImage(id, file, origName);
      if (!saved.ok) {
        return NextResponse.json({ error: saved.error }, { status: 400 });
      }
      proofImagePath = saved.publicPath;
    } else if (auth.user.role === "admin") {
      if (file instanceof Blob && file.size > 0) {
        const origName =
          typeof (file as File).name === "string"
            ? (file as File).name
            : "receipt.jpg";
        const saved = await saveCommissionProofImage(id, file, origName);
        if (!saved.ok) {
          return NextResponse.json({ error: saved.error }, { status: 400 });
        }
        proofImagePath = saved.publicPath;
      }
    }
  } else if (auth.user.role === "admin") {
    proofImagePath = undefined;
  } else {
    return NextResponse.json(
      {
        error:
          'Use multipart form data with a "proof" file (screenshot or receipt).',
      },
      { status: 400 },
    );
  }

  const updated = recordSupplierPlatformCommission(id, {
    proofImagePath: proofImagePath,
  });
  if (!updated) {
    return NextResponse.json(
      {
        error:
          "Could not record — order must be delivered, supplier commission must apply, and it must not already be recorded",
      },
      { status: 400 },
    );
  }
  return NextResponse.json({ order: updated });
}
