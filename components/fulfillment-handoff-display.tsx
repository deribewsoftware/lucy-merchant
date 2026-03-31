import Link from "next/link";
import { Building2, PackageCheck, Truck } from "lucide-react";
import {
  fulfillmentHandoffDisplayBlocks,
  type FulfillmentAudience,
} from "@/lib/domain/fulfillment-handoff-copy";
import type { OrderFulfillmentHandoff } from "@/lib/domain/types";

type Props = {
  fulfillmentHandoff: OrderFulfillmentHandoff | undefined;
  audience: FulfillmentAudience;
  /** Merchant order detail: link to supplier company when pickup. */
  supplierCompanyId?: string;
  supplierCompanyName?: string;
};

export function FulfillmentHandoffDisplay({
  fulfillmentHandoff,
  audience,
  supplierCompanyId,
  supplierCompanyName,
}: Props) {
  if (!fulfillmentHandoff) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-border/50 bg-muted/25 p-5 shadow-sm ring-1 ring-border/20 sm:p-6">
        <div className="flex gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <PackageCheck className="h-6 w-6" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="lm-eyebrow text-muted-foreground">Fulfillment</p>
            <p className="mt-1 font-display text-base font-semibold text-foreground">
              Coordinate in chat
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              This order was placed before pickup vs. delivery choice was available. Use the
              address on the order and order chat to agree how and where goods change hands.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const blocks = fulfillmentHandoffDisplayBlocks(fulfillmentHandoff, audience);
  const isDeliver = fulfillmentHandoff === "supplier_delivers_to_shop";
  const accent = isDeliver
    ? "from-sky-500/15 via-primary/10 to-transparent border-sky-500/25 text-sky-700 dark:text-sky-300"
    : "from-violet-500/15 via-accent/10 to-transparent border-violet-500/30 text-violet-800 dark:text-violet-200";

  return (
    <div
      className={`relative overflow-hidden rounded-xl border bg-gradient-to-br p-5 shadow-md ring-1 ring-border/25 sm:p-6 ${accent}`}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-white/40 to-transparent opacity-50 dark:from-white/5" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border bg-background/90 shadow-inner ${
            isDeliver ? "border-sky-500/30 text-sky-600 dark:text-sky-400" : "border-violet-500/35 text-violet-700 dark:text-violet-300"
          }`}
        >
          {isDeliver ? (
            <Truck className="h-7 w-7" aria-hidden />
          ) : (
            <Building2 className="h-7 w-7" aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              {blocks.eyebrow}
            </p>
            <h3 className="mt-1 font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {blocks.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              {blocks.lead}
            </p>
          </div>
          <ul className="space-y-2 border-t border-border/40 pt-4 text-sm text-foreground/90">
            {blocks.bullets.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span className="leading-snug">{line}</span>
              </li>
            ))}
          </ul>
          {audience === "merchant" &&
          fulfillmentHandoff === "merchant_pickup_at_supplier" &&
          supplierCompanyId ? (
            <div className="pt-1">
              <Link
                href={`/companies/${supplierCompanyId}`}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border/60 bg-background/80 px-4 py-2 text-sm font-semibold text-primary shadow-sm transition hover:border-primary/40 hover:bg-background"
              >
                <Building2 className="h-4 w-4 shrink-0 opacity-80" />
                Open {supplierCompanyName ?? "supplier"} profile
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
