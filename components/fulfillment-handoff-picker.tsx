"use client";

import { Building2, Sparkles, Truck } from "lucide-react";
import clsx from "clsx";
import type { OrderFulfillmentHandoff } from "@/lib/domain/types";

type Props = {
  value: OrderFulfillmentHandoff;
  onChange: (v: OrderFulfillmentHandoff) => void;
};

export function FulfillmentHandoffPicker({ value, onChange }: Props) {
  return (
    <fieldset className="space-y-3">
      <legend className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
        How do you want to receive the goods?
        <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
          Optional
        </span>
      </legend>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Pick what matches your deal: supplier brings stock to{" "}
        <span className="font-medium text-foreground">your shop</span>, or you{" "}
        <span className="font-medium text-foreground">visit the supplier</span> to collect. You
        can refine timing in order chat—this choice sets expectations for both sides.
      </p>

      <div className="grid gap-3 sm:grid-cols-1">
        <button
          type="button"
          onClick={() => onChange("supplier_delivers_to_shop")}
          className={clsx(
            "group relative flex w-full flex-col gap-3 overflow-hidden rounded-2xl border p-4 text-left shadow-sm transition-all sm:flex-row sm:items-start sm:gap-4 sm:p-5",
            value === "supplier_delivers_to_shop"
              ? "border-sky-500/50 bg-gradient-to-br from-sky-500/10 via-primary/5 to-transparent ring-2 ring-sky-500/30"
              : "border-border/50 bg-card/80 hover:border-primary/25 hover:shadow-md",
          )}
        >
          <span
            className={clsx(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-inner transition",
              value === "supplier_delivers_to_shop"
                ? "border-sky-500/40 bg-background text-sky-600 dark:text-sky-400"
                : "border-border/50 bg-muted/50 text-muted-foreground group-hover:text-primary",
            )}
          >
            <Truck className="h-6 w-6" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-display text-base font-bold text-foreground sm:text-lg">
                Deliver to my shop
              </span>
              {value === "supplier_delivers_to_shop" ? (
                <Sparkles className="h-4 w-4 text-sky-500 dark:text-sky-400" aria-hidden />
              ) : null}
            </span>
            <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
              The supplier brings the order to your business. You&apos;ll set the drop-off address
              below—their job is to meet you there.
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => onChange("merchant_pickup_at_supplier")}
          className={clsx(
            "group relative flex w-full flex-col gap-3 overflow-hidden rounded-2xl border p-4 text-left shadow-sm transition-all sm:flex-row sm:items-start sm:gap-4 sm:p-5",
            value === "merchant_pickup_at_supplier"
              ? "border-violet-500/45 bg-gradient-to-br from-violet-500/10 via-accent/5 to-transparent ring-2 ring-violet-500/35"
              : "border-border/50 bg-card/80 hover:border-primary/25 hover:shadow-md",
          )}
        >
          <span
            className={clsx(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-inner transition",
              value === "merchant_pickup_at_supplier"
                ? "border-violet-500/40 bg-background text-violet-700 dark:text-violet-300"
                : "border-border/50 bg-muted/50 text-muted-foreground group-hover:text-primary",
            )}
          >
            <Building2 className="h-6 w-6" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-display text-base font-bold text-foreground sm:text-lg">
                I&apos;ll collect at the supplier
              </span>
              {value === "merchant_pickup_at_supplier" ? (
                <Sparkles className="h-4 w-4 text-violet-500 dark:text-violet-300" aria-hidden />
              ) : null}
            </span>
            <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
              You travel to the supplier&apos;s company or shop. Use their profile and chat to lock
              the gate, hours, and who releases the stock—your note below backs that plan.
            </span>
          </span>
        </button>
      </div>
    </fieldset>
  );
}
