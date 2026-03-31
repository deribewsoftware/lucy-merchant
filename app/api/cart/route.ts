import { NextResponse } from "next/server";
import { getCompany, getProduct } from "@/lib/db/catalog";
import { getCart, setCartItem } from "@/lib/db/commerce";
import { effectiveMaxDeliveryPerOrder } from "@/lib/domain/max-delivery";
import type { CartItem } from "@/lib/domain/types";
import { API_MERCHANT_COMMISSION_SUSPENDED } from "@/lib/domain/commission-hold-copy";
import { merchantHasOutstandingCommission } from "@/lib/server/merchant-commission";
import { requireSession } from "@/lib/server/require-session";
import { checkRateLimit, clientIp } from "@/lib/server/rate-limit";

export async function GET() {
  const auth = await requireSession(["merchant"]);
  if (!auth.ok) return auth.response;
  return NextResponse.json({ cart: getCart(auth.user.id) });
}

export async function POST(request: Request) {
  const auth = await requireSession(["merchant"]);
  if (!auth.ok) return auth.response;

  if (merchantHasOutstandingCommission(auth.user.id)) {
    return NextResponse.json({ error: API_MERCHANT_COMMISSION_SUSPENDED }, { status: 403 });
  }

  const ip = clientIp(request);
  const rl = checkRateLimit(`cart:${auth.user.id}:${ip}`, 90, 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Cart updates throttled. Retry in ${rl.retryAfterSec}s` },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const productId = String(body?.productId ?? "");
  const quantity = Math.max(1, Number(body?.quantity) || 1);
  const product = getProduct(productId);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  const company = getCompany(product.companyId);
  if (!company?.isVerified) {
    return NextResponse.json(
      { error: "Product is not available from a verified company" },
      { status: 400 },
    );
  }
  if (quantity < product.minOrderQuantity) {
    return NextResponse.json(
      { error: `Minimum order quantity is ${product.minOrderQuantity}` },
      { status: 400 },
    );
  }
  const cap = effectiveMaxDeliveryPerOrder(product);
  if (quantity > cap) {
    if (quantity > product.availableQuantity) {
      return NextResponse.json({ error: "Not enough stock" }, { status: 400 });
    }
    const m = product.maxDeliveryQuantity;
    return NextResponse.json(
      {
        error: `Max delivery quantity is ${typeof m === "number" && m > 0 ? m : cap}`,
      },
      { status: 400 },
    );
  }

  const price = product.price;
  const item: CartItem = {
    productId,
    companyId: product.companyId,
    quantity,
    price,
    subtotal: Math.round(price * quantity * 100) / 100,
  };
  const cart = setCartItem(auth.user.id, item);
  return NextResponse.json({ cart });
}

export async function PATCH(request: Request) {
  return POST(request);
}

export async function DELETE(request: Request) {
  const auth = await requireSession(["merchant"]);
  if (!auth.ok) return auth.response;

  const ip = clientIp(request);
  const rl = checkRateLimit(`cart:${auth.user.id}:${ip}`, 90, 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Cart updates throttled. Retry in ${rl.retryAfterSec}s` },
      { status: 429 },
    );
  }

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }
  const cart = setCartItem(auth.user.id, {
    productId,
    companyId: "",
    quantity: 0,
    price: 0,
    subtotal: 0,
  });
  return NextResponse.json({ cart });
}
