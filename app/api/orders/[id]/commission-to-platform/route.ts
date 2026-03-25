import { NextResponse } from "next/server";
import { getOrder } from "@/lib/db/commerce";
import { recordMerchantPlatformCommission } from "@/lib/payments/record-platform-commission";
import { saveCommissionProofImage } from "@/lib/server/commission-proof-upload";
import { requireSession } from "@/lib/server/require-session";
import { checkRateLimit, clientIp } from "@/lib/server/rate-limit";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/** Merchant records buyer → platform commission; requires payment proof image (multipart). Admin may POST without file. */
export async function POST(request: Request, context: Params) {
  const auth = await requireSession(["merchant", "admin"]);
  if (!auth.ok) return auth.response;

  const ip = clientIp(request);
  const rl = checkRateLimit(
    `merchant-commission:${auth.user.id}:${ip}`,
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

  if (auth.user.role === "merchant" && order.merchantId !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ct = request.headers.get("content-type") ?? "";
  let proofImagePath: string | undefined;

  if (ct.includes("multipart/form-data")) {
    const form = await request.formData().catch(() => null);
    const file = form?.get("proof");
    if (auth.user.role === "merchant") {
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

  const updated = recordMerchantPlatformCommission(id, {
    proofImagePath: proofImagePath,
  });
  if (!updated) {
    return NextResponse.json(
      {
        error:
          "Could not record — order must be delivered and commission not yet recorded",
      },
      { status: 400 },
    );
  }
  return NextResponse.json({ order: updated });
}
