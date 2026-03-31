import type { OrderFulfillmentHandoff } from "@/lib/domain/types";

const HANDOFFS: readonly OrderFulfillmentHandoff[] = [
  "supplier_delivers_to_shop",
  "merchant_pickup_at_supplier",
] as const;

export function parseFulfillmentHandoff(
  raw: unknown,
): OrderFulfillmentHandoff {
  const s = String(raw ?? "").trim();
  return HANDOFFS.includes(s as OrderFulfillmentHandoff)
    ? (s as OrderFulfillmentHandoff)
    : "supplier_delivers_to_shop";
}

export function fulfillmentHandoffShortLabel(
  mode: OrderFulfillmentHandoff,
): string {
  switch (mode) {
    case "supplier_delivers_to_shop":
      return "Deliver to my shop";
    case "merchant_pickup_at_supplier":
      return "I’ll collect at supplier";
    default:
      return "—";
  }
}

export type FulfillmentAudience = "merchant" | "supplier" | "admin";

export function fulfillmentHandoffDisplayBlocks(
  mode: OrderFulfillmentHandoff,
  audience: FulfillmentAudience,
): {
  eyebrow: string;
  title: string;
  lead: string;
  bullets: string[];
} {
  if (audience === "merchant") {
    if (mode === "supplier_delivers_to_shop") {
      return {
        eyebrow: "Fulfillment you chose",
        title: "Supplier delivers to your shop",
        lead:
          "The supplier brings the goods to your business. The address below is where they should meet you—lock in time and access details in order chat.",
        bullets: [
          "You stay put; they travel to your door.",
          "Cash or transfer still follows the payment method you picked.",
        ],
      };
    }
    return {
      eyebrow: "Fulfillment you chose",
      title: "You collect at the supplier",
      lead:
        "You’ll pick up the order at the supplier’s company or shop. Use their listing and chat to confirm the exact gate, hours, and who to ask for.",
      bullets: [
        "Plan the visit; bring ID or order reference if they require it.",
        "The address field is your checkout note—supplier premises stay the source of truth.",
      ],
    };
  }

  if (audience === "supplier") {
    if (mode === "supplier_delivers_to_shop") {
      return {
        eyebrow: "Buyer expectation",
        title: "Deliver to their shop",
        lead:
          "The buyer expects you to bring the order to the address on this order. Align on timing, unloading, and proof of handoff in chat.",
        bullets: [
          "Ship or drive to the buyer’s business location they entered.",
          "Confirm COD or paid transfer matches your usual process.",
        ],
      };
    }
    return {
      eyebrow: "Buyer expectation",
      title: "Buyer pickup at your premises",
      lead:
        "The buyer will collect at your company. Make pickup windows and who releases stock obvious in chat so the handoff is frictionless.",
      bullets: [
        "Share precise location, hours, and contact on site.",
        "Release goods only when your payment rules are satisfied.",
      ],
    };
  }

  // admin
  if (mode === "supplier_delivers_to_shop") {
    return {
      eyebrow: "Recorded handoff",
      title: "Supplier → buyer shop delivery",
      lead:
        "Supplier is expected to deliver to the buyer’s stated business address. Disputes should reference chat and this address.",
      bullets: [
        "Physical movement: supplier to buyer location.",
        "Ledger and commission rules unchanged.",
      ],
    };
  }
  return {
    eyebrow: "Recorded handoff",
    title: "Buyer pickup at supplier",
    lead:
      "Buyer collects at supplier premises. Coordinate details live in order chat; address field may hold buyer notes.",
    bullets: [
      "Physical movement: buyer travels to supplier.",
      "Ledger and commission rules unchanged.",
    ],
  };
}
