import { NextResponse } from "next/server";
import { appendOrderMessage, listMessagesForOrder } from "@/lib/db/chat";
import { getOrder } from "@/lib/db/commerce";
import { getCompany } from "@/lib/db/catalog";
import { getPresenceForUsers, touchPresence } from "@/lib/db/presence";
import { notifyOrderChatRecipients } from "@/lib/db/notifications";
import { canAccessOrder } from "@/lib/server/order-access";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { requireSession } from "@/lib/server/require-session";
import { resolveChatSenderRole } from "@/lib/server/resolve-chat-sender-role";
import type { Order } from "@/lib/domain/types";

type Params = { params: Promise<{ id: string }> };

function orderParticipantUserIds(order: Order): string[] {
  const ids = new Set<string>();
  ids.add(order.merchantId);
  for (const item of order.items) {
    const co = getCompany(item.companyId);
    if (co) ids.add(co.ownerId);
  }
  return [...ids];
}

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

  const raw = listMessagesForOrder(id);
  const messages = raw.map((m) => ({
    ...m,
    senderRole: resolveChatSenderRole(m, order),
  }));
  const presenceIds = new Set<string>(orderParticipantUserIds(order));
  for (const m of messages) presenceIds.add(m.senderId);
  const presence = getPresenceForUsers([...presenceIds]);
  return NextResponse.json({ messages, presence });
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
  const imageUrlRaw =
    kind === "price_proposal" ? undefined : body?.imageUrl;
  const imageUrl =
    typeof imageUrlRaw === "string" &&
    imageUrlRaw.startsWith("/uploads/order-chat/") &&
    !imageUrlRaw.includes("..") &&
    imageUrlRaw.length < 500
      ? imageUrlRaw.trim()
      : undefined;
  try {
    touchPresence(auth.user.id);
    const msg = appendOrderMessage({
      orderId: id,
      senderId: auth.user.id,
      senderName: auth.user.name,
      senderRole: auth.user.role,
      content,
      kind,
      proposedUnitPrice,
      imageUrl,
    });
    const preview =
      msg.content.trim() || (msg.imageUrl ? "[Image]" : "");
    notifyOrderChatRecipients(order, auth.user.id, preview);
    return NextResponse.json({ message: msg });
  } catch (e) {
    const m = e instanceof Error ? e.message : "Failed to send";
    return NextResponse.json({ error: m }, { status: 400 });
  }
}
