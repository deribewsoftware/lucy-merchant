import clsx from "clsx";
import {
  productOrderSpecLines,
  type ProductOrderSpecInput,
} from "@/lib/domain/product-order-specs";

type Props = {
  product: ProductOrderSpecInput;
  /** Default false on list cards / search; true on PDP blocks that omit stock elsewhere */
  includeStock?: boolean;
  /** Set false when lead time is shown separately (e.g. product page Delivery stat) */
  includeLeadTime?: boolean;
  className?: string;
  /** `xs` for dense cards and search; `sm` for home / readable cards */
  size?: "xs" | "sm";
  align?: "start" | "end";
  /** `muted` matches supplier dashboard zinc text */
  tone?: "default" | "muted";
};

export function ProductOrderSpecs({
  product,
  includeStock = false,
  includeLeadTime = true,
  className,
  size = "xs",
  align = "start",
  tone = "default",
}: Props) {
  const lines = productOrderSpecLines(product, {
    includeStock,
    includeLeadTime,
  });

  if (lines.length === 0) return null;

  const muted = tone === "muted";

  return (
    <div
      className={clsx(
        "space-y-0.5",
        muted ? "text-zinc-600 dark:text-zinc-400" : "text-base-content/60",
        size === "sm"
          ? "text-sm leading-snug"
          : "text-[11px] leading-snug sm:text-xs",
        align === "end" && "sm:text-right",
        className,
      )}
    >
      {lines.map(({ label, detail }) => (
        <p
          key={label}
          className={clsx(
            "flex flex-wrap gap-x-1",
            align === "end" && "sm:block sm:truncate",
          )}
        >
          <span
            className={clsx(
              "font-medium",
              muted
                ? "text-zinc-700 dark:text-zinc-300"
                : "text-base-content/70",
            )}
          >
            {label}:{" "}
          </span>
          <span className={clsx("min-w-0", align === "end" && "sm:max-w-[14rem]")}>
            {detail}
          </span>
        </p>
      ))}
    </div>
  );
}
