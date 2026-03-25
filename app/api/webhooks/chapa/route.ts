import { NextResponse } from "next/server";
import { listOrders, patchOrder } from "@/lib/db/commerce";
import { verifyChapaTransaction } from "@/lib/payments/chapa-client";
import {
  getChapaWebhookSecret,
  verifyChapaWebhookSignature,
} from "@/lib/payments/chapa-webhook-verify";

export const runtime = "nodejs";

function extractTxRef(body: Record<string, unknown> | null): string {
  if (!body) return "";
  const tx =
    (typeof body.tx_ref === "string" && body.tx_ref) ||
    (typeof body.trx_ref === "string" && body.trx_ref) ||
    (typeof body.reference === "string" && body.reference) ||
    "";
  return tx;
}

/**
 * Chapa server callback (POST). Verifies `x-chapa-signature` when configured.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const sig =
    request.headers.get("x-chapa-signature") ??
    request.headers.get("chapa-signature");

  if (getChapaWebhookSecret() && sig) {
    const ok = verifyChapaWebhookSignature(rawBody, sig);
    if (!ok) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let parsed: Record<string, unknown> | null = null;
  try {
    parsed = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const txRef = extractTxRef(parsed);
  if (!txRef) {
    return NextResponse.json({ error: "Missing tx_ref" }, { status: 400 });
  }

  const verified = await verifyChapaTransaction(txRef);
  if (!verified.ok) {
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  }

  const orderIds = listOrders()
    .filter((o) => o.externalPaymentRef === txRef)
    .map((o) => o.id);
  const capturedAt = new Date().toISOString();
  for (const id of orderIds) {
    patchOrder(id, {
      gatewayPaymentCapturedAt: capturedAt,
      externalPaymentRef: txRef,
    });
  }

  return NextResponse.json({ ok: true });
}
