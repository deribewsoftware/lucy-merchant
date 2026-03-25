import { findUserById } from "@/lib/db/users";
import type { ChatMessage, Order, UserRole } from "@/lib/domain/types";

/** Resolve role for display; supports legacy messages without `senderRole`. */
export function resolveChatSenderRole(
  m: Pick<ChatMessage, "senderId" | "senderRole">,
  order: Pick<Order, "merchantId">,
): UserRole {
  if (m.senderRole) return m.senderRole;
  if (m.senderId === order.merchantId) return "merchant";
  const u = findUserById(m.senderId);
  if (u) return u.role;
  return "supplier";
}
