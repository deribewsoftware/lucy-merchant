import { NextResponse } from "next/server";
import { patchOrder } from "@/lib/db/commerce";
import { getStripe } from "@/lib/payments/stripe-checkout";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Stripe webhook not configured" }, { status: 503 });
  }

  const payload = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: import("stripe").Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as import("stripe").Stripe.Checkout.Session;
    const raw = session.metadata?.order_ids ?? "";
    const ids = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const capturedAt = new Date().toISOString();
    for (const orderId of ids) {
      patchOrder(orderId, {
        gatewayPaymentCapturedAt: capturedAt,
        externalPaymentRef: session.id,
      });
    }
  }

  return NextResponse.json({ received: true });
}
