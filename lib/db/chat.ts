import { randomUUID } from "crypto";
import type { ChatMessage, UserRole } from "@/lib/domain/types";
import { readJsonFile, writeJsonFile } from "@/lib/store/json-file";

const FILE = "chat-messages.json";

export function listMessagesForOrder(orderId: string): ChatMessage[] {
  const all = readJsonFile<ChatMessage[]>(FILE, []);
  return all
    .filter((m) => m.orderId === orderId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

const UPLOAD_CHAT_PREFIX = "/uploads/order-chat/";

function isAllowedChatImageUrl(url: string): boolean {
  return (
    url.startsWith(UPLOAD_CHAT_PREFIX) &&
    !url.includes("..") &&
    url.length < 500
  );
}

export function appendOrderMessage(input: {
  orderId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  content: string;
  kind?: ChatMessage["kind"];
  proposedUnitPrice?: number;
  imageUrl?: string;
}): ChatMessage {
  const kind =
    input.kind === "price_proposal"
      ? "price_proposal"
      : input.imageUrl
        ? "image"
        : "text";
  let content = input.content.trim();
  if (kind === "price_proposal") {
    const price = Number(input.proposedUnitPrice);
    if (!Number.isFinite(price) || price <= 0) {
      throw new Error("Proposed unit price must be a positive number");
    }
    if (!content) {
      content = `Proposed unit price: ${price.toLocaleString()} ETB`;
    }
    const all = readJsonFile<ChatMessage[]>(FILE, []);
    const msg: ChatMessage = {
      id: randomUUID(),
      orderId: input.orderId,
      senderId: input.senderId,
      senderName: input.senderName,
      senderRole: input.senderRole,
      content,
      createdAt: new Date().toISOString(),
      kind: "price_proposal",
      proposedUnitPrice: Math.round(price * 100) / 100,
    };
    all.push(msg);
    writeJsonFile(FILE, all);
    return msg;
  }
  if (kind === "image") {
    const imageUrl = input.imageUrl?.trim();
    if (!imageUrl || !isAllowedChatImageUrl(imageUrl)) {
      throw new Error("Invalid image");
    }
    const all = readJsonFile<ChatMessage[]>(FILE, []);
    const msg: ChatMessage = {
      id: randomUUID(),
      orderId: input.orderId,
      senderId: input.senderId,
      senderName: input.senderName,
      senderRole: input.senderRole,
      content,
      createdAt: new Date().toISOString(),
      kind: "image",
      imageUrl,
    };
    all.push(msg);
    writeJsonFile(FILE, all);
    return msg;
  }
  if (!content) {
    throw new Error("Message cannot be empty");
  }
  const all = readJsonFile<ChatMessage[]>(FILE, []);
  const msg: ChatMessage = {
    id: randomUUID(),
    orderId: input.orderId,
    senderId: input.senderId,
    senderName: input.senderName,
    senderRole: input.senderRole,
    content,
    createdAt: new Date().toISOString(),
    kind: "text",
  };
  all.push(msg);
  writeJsonFile(FILE, all);
  return msg;
}
