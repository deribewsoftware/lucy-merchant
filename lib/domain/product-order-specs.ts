/** Optional wholesale packaging — used to show clear min order in items, cartons, rims, dozen. */

export type ProductOrderSpecInput = {
  minOrderQuantity: number;
  maxDeliveryQuantity?: number;
  deliveryTime?: string;
  availableQuantity?: number;
  itemsPerCarton?: number;
  itemsPerRim?: number;
  itemsPerDozen?: number;
};

export type ProductOrderSpecLine = { label: string; detail: string };

export function productOrderSpecLines(
  p: ProductOrderSpecInput,
  options?: { includeStock?: boolean; includeLeadTime?: boolean },
): ProductOrderSpecLine[] {
  const includeStock = options?.includeStock !== false;
  const includeLeadTime = options?.includeLeadTime !== false;
  const moq = Math.max(1, Math.floor(p.minOrderQuantity) || 1);
  const lines: ProductOrderSpecLine[] = [
    {
      label: "Min. order",
      detail: `${moq} ${moq === 1 ? "item" : "items"}`,
    },
  ];

  const perCarton = p.itemsPerCarton;
  if (typeof perCarton === "number" && perCarton > 0) {
    const cartons = Math.ceil(moq / perCarton);
    lines.push({
      label: "Min. cartons",
      detail: `${cartons} (${perCarton} items/carton)`,
    });
  }

  const perRim = p.itemsPerRim;
  if (typeof perRim === "number" && perRim > 0) {
    const rims = Math.ceil(moq / perRim);
    lines.push({
      label: "Min. rims",
      detail: `${rims} (${perRim} items/rim)`,
    });
  }

  const perDozen = p.itemsPerDozen;
  if (typeof perDozen === "number" && perDozen > 0) {
    const dozens = Math.ceil(moq / perDozen);
    lines.push({
      label: "Min. dozen",
      detail: `${dozens} (${perDozen} items/dozen)`,
    });
  }

  const maxDel = p.maxDeliveryQuantity;
  if (typeof maxDel === "number" && maxDel > 0) {
    lines.push({
      label: "Max. per delivery",
      detail: `${maxDel} ${maxDel === 1 ? "item" : "items"}`,
    });
  }

  const stock = p.availableQuantity;
  if (
    includeStock &&
    typeof stock === "number" &&
    stock >= 0
  ) {
    lines.push({
      label: "In stock",
      detail: `${stock} ${stock === 1 ? "item" : "items"}`,
    });
  }

  const lead = p.deliveryTime?.trim();
  if (includeLeadTime && lead) {
    lines.push({ label: "Lead time", detail: lead });
  }

  return lines;
}
