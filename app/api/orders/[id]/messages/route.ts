import { NextResponse } from "next/server";
import { appendOrderMessage, listMessagesForOrder } from "@/lib/db/chat";
import { getOrder } from "@/lib/db/commerce";
import { notifyOrderChatRecipients } from "@/lib/db/notifications";
import { requireSession } from "@/lib/server/require-session";
import { canAccessOrder } from "@/lib/server/order-access";
import { checkRateLimit } from "@/lib/server/rate-limit";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Params) {
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

  return NextResponse.json({ messages: listMessagesForOrder(id) });
}

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

  if (order.status === "rejected" || order.status === "completed") {
    return NextResponse.json(
      { error: "Chat is closed for this order" },
      { status: 400 },
    );
  }

  const msgRl = checkRateLimit(
    `orderchat:${id}:${auth.user.id}`,
    50,
    60 * 1000,
  );
  if (!msgRl.ok) {
    return NextResponse.json(
      {
        error: `Sending too fast. Retry in ${msgRl.retryAfterSec}s`,
      },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const content = String(body?.content ?? "");
  const kind =
    body?.kind === "price_proposal" ? "price_proposal" : ("text" as const);
  const proposedUnitPrice =
    kind === "price_proposal" ? Number(body?.proposedUnitPrice) : undefined;
  try {
    const msg = appendOrderMessage({
      orderId: id,
      senderId: auth.user.id,
      senderName: auth.user.name,
      content,
      kind,
      proposedUnitPrice,
    });
    notifyOrderChatRecipients(order, auth.user.id, msg.content);
    return NextResponse.json({ message: msg });
  } catch (e) {
    const m = e instanceof Error ? e.message : "Failed to send";
    return NextResponse.json({ error: m }, { status: 400 });
  }
}
