import { randomUUID } from "crypto";
import type { ChatMessage } from "@/lib/domain/types";
import { readJsonFile, writeJsonFile } from "@/lib/store/json-file";

const FILE = "chat-messages.json";

export function listMessagesForOrder(orderId: string): ChatMessage[] {
  const all = readJsonFile<ChatMessage[]>(FILE, []);
  return all
    .filter((m) => m.orderId === orderId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function appendOrderMessage(input: {
  orderId: string;
  senderId: string;
  senderName: string;
  content: string;
  kind?: ChatMessage["kind"];
  proposedUnitPrice?: number;
}): ChatMessage {
  const kind = input.kind === "price_proposal" ? "price_proposal" : "text";
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
      content,
      createdAt: new Date().toISOString(),
      kind: "price_proposal",
      proposedUnitPrice: Math.round(price * 100) / 100,
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
    content,
    createdAt: new Date().toISOString(),
    kind: "text",
  };
  all.push(msg);
  writeJsonFile(FILE, all);
  return msg;
}
