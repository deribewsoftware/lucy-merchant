import { randomUUID } from "crypto";
import type { Order, Payment, PaymentMethod } from "@/lib/domain/types";
import { readJsonFile, writeJsonFile } from "@/lib/store/json-file";

const FILE = "payments.json";

function load(): Payment[] {
  return readJsonFile<Payment[]>(FILE, []);
}

function save(rows: Payment[]) {
  writeJsonFile(FILE, rows);
}

export function createPayment(input: {
  orderId: string;
  method: PaymentMethod;
  amount: number;
  transactionRef?: string;
}): Payment {
  const rows = load();
  const payment: Payment = {
    id: randomUUID(),
    orderId: input.orderId,
    method: input.method,
    status: "pending",
    amount: Math.round(input.amount * 100) / 100,
    transactionRef: input.transactionRef?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  rows.push(payment);
  save(rows);
  return payment;
}

export function listPaymentsForOrder(orderId: string): Payment[] {
  return load().filter((p) => p.orderId === orderId);
}

/**
 * Older checkouts may lack a payment row; create a pending record from the order
 * so confirmation and admin views stay consistent.
 */
export function ensureLegacyPaymentForOrder(order: Order): void {
  if (listPaymentsForOrder(order.id).length > 0) return;
  const method = order.paymentMethod;
  if (
    method !== "cod" &&
    method !== "bank_transfer" &&
    method !== "stripe" &&
    method !== "chapa" &&
    method !== "telebirr"
  ) {
    return;
  }
  createPayment({
    orderId: order.id,
    method,
    amount: order.totalPrice,
  });
}

/** Marks the first pending payment for this order as paid (COD / bank confirmed). */
export function deletePaymentsForOrder(orderId: string): void {
  const rows = load().filter((p) => p.orderId !== orderId);
  save(rows);
}

export function markPendingPaymentPaid(
  orderId: string,
  transactionRef?: string,
): Payment | undefined {
  const rows = load();
  const idx = rows.findIndex(
    (p) => p.orderId === orderId && p.status === "pending",
  );
  if (idx === -1) return undefined;
  const ref = transactionRef?.trim();
  rows[idx] = {
    ...rows[idx],
    status: "paid",
    ...(ref ? { transactionRef: ref } : {}),
  };
  save(rows);
  return rows[idx];
}
