import axios from "axios";
import { getPublicAppUrl } from "@/lib/app-url";

export async function createChapaCheckout(opts: {
  amountEtb: number;
  email: string;
  merchantName: string;
  orderIds: string[];
}): Promise<{ checkoutUrl: string; txRef: string } | null> {
  const secret = process.env.CHAPA_SECRET_KEY?.trim();
  if (!secret) return null;

  const base = getPublicAppUrl();

  const txRef = `lucy-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const res = await axios.post(
    "https://api.chapa.co/v1/transaction/initialize",
    {
      amount: opts.amountEtb.toFixed(2),
      currency: "ETB",
      email: opts.email,
      first_name: opts.merchantName.trim().split(/\s+/)[0] || "Merchant",
      last_name:
        opts.merchantName.trim().split(/\s+/).slice(1).join(" ") || "Buyer",
      tx_ref: txRef,
      callback_url: `${base}/api/webhooks/chapa`,
      return_url: `${base}/merchant/orders?checkout=chapa`,
      meta: {
        order_ids: opts.orderIds.join(","),
      },
    },
    { headers: { Authorization: `Bearer ${secret}` } },
  );

  const data = res.data?.data;
  if (!data?.checkout_url) return null;
  return { checkoutUrl: data.checkout_url as string, txRef };
}

export async function verifyChapaTransaction(txRef: string): Promise<{
  ok: boolean;
  amount?: string;
  currency?: string;
}> {
  const secret = process.env.CHAPA_SECRET_KEY?.trim();
  if (!secret) return { ok: false };

  const res = await axios.get(
    `https://api.chapa.co/v1/transaction/verify/${encodeURIComponent(txRef)}`,
    { headers: { Authorization: `Bearer ${secret}` } },
  );
  const status = res.data?.data?.status;
  return { ok: status === "success", amount: res.data?.data?.amount };
}
