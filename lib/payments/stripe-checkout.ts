import Stripe from "stripe";
import { getPublicAppUrl } from "@/lib/app-url";
import type { Order } from "@/lib/domain/types";

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key?.trim()) return null;
  return new Stripe(key);
}

/**
 * Single Checkout Session for one or more supplier-split orders (same cart checkout).
 */
export async function createStripeCheckoutForOrders(
  orders: Order[],
  merchantEmail: string,
): Promise<{ url: string; sessionId: string } | null> {
  const stripe = getStripe();
  if (!stripe || orders.length === 0) return null;

  const base = getPublicAppUrl();

  const total =
    Math.round(orders.reduce((s, o) => s + o.totalPrice, 0) * 100) / 100;
  const unitAmount = Math.round(total * 100);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "etb",
          product_data: {
            name: "Lucy Merchant checkout",
            description: `${orders.length} order(s) to supplier(s)`,
          },
          unit_amount: unitAmount,
        },
        quantity: 1,
      },
    ],
    customer_email: merchantEmail,
    metadata: {
      order_ids: orders.map((o) => o.id).join(","),
    },
    success_url: `${base}/merchant/orders?checkout=success`,
    cancel_url: `${base}/merchant/cart?checkout=cancelled`,
  });

  if (!session.url) return null;
  return { url: session.url, sessionId: session.id };
}
