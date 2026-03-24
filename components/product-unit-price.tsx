import { hasDiscountPrice } from "@/lib/domain/compare-at-price";

type Props = {
  price: number;
  compareAtPrice?: number | null;
  /** e.g. " each" suffix for unit pricing */
  suffix?: string;
  /** `stacked`: was / now on separate lines (e.g. product stat). Default: single-line inline. */
  variant?: "inline" | "stacked";
  className?: string;
  strikeClassName?: string;
  saleClassName?: string;
};

export function ProductUnitPrice({
  price,
  compareAtPrice,
  suffix,
  variant = "inline",
  className = "",
  strikeClassName = "text-base-content/45 line-through decoration-base-content/35",
  saleClassName = "font-semibold text-primary",
}: Props) {
  const showWas = hasDiscountPrice(price, compareAtPrice);

  if (variant === "stacked") {
    return (
      <span className={`flex flex-col items-center gap-1 ${className}`}>
        {showWas ? (
          <span className={`tabular-nums ${strikeClassName}`}>
            <span className="sr-only">Was </span>
            {compareAtPrice.toLocaleString()} ETB
          </span>
        ) : null}
        <span className={`tabular-nums ${saleClassName}`}>
          {!showWas ? <span className="sr-only">Unit price: </span> : null}
          {showWas ? <span className="sr-only">Now </span> : null}
          {price.toLocaleString()} ETB
        </span>
        {suffix ? (
          <span className="text-[11px] font-medium text-base-content/45">
            {suffix}
          </span>
        ) : null}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex flex-wrap items-baseline gap-x-1 gap-y-0 ${className}`}
    >
      {showWas ? (
        <span className={`tabular-nums ${strikeClassName}`}>
          <span className="sr-only">Was </span>
          {compareAtPrice.toLocaleString()} ETB
        </span>
      ) : null}
      {showWas ? <span className="text-base-content/35">·</span> : null}
      <span className={`tabular-nums ${saleClassName}`}>
        {!showWas ? <span className="sr-only">Unit price: </span> : null}
        {showWas ? <span className="sr-only">Now </span> : null}
        {price.toLocaleString()} ETB
      </span>
      {suffix ? (
        <span className="text-[11px] font-medium text-base-content/45">{suffix}</span>
      ) : null}
    </span>
  );
}
