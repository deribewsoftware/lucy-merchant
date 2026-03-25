import clsx from "clsx";

const MARK_SIZE = {
  sm: "h-3.5 w-3.5 min-h-3.5 min-w-3.5",
  md: "h-[1.15rem] w-[1.15rem] min-h-[1.15rem] min-w-[1.15rem] sm:h-5 sm:w-5 sm:min-h-5 sm:min-w-5",
  lg: "h-5 w-5 min-h-5 min-w-5 sm:h-6 sm:w-6",
  xl: "h-6 w-6 min-h-6 min-w-6 sm:h-7 sm:w-7",
} as const;

export type LucyMerchantMarkSize = keyof typeof MARK_SIZE;

type Props = {
  className?: string;
  size?: LucyMerchantMarkSize;
};

/**
 * Lucy Merchant mark: bold “LM” monogram, trade arc, and spark — reads on teal gradients.
 */
export function LucyMerchantMark({ className, size = "md" }: Props) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx(MARK_SIZE[size], className)}
      aria-hidden
      focusable="false"
    >
      {/* Connection arc — marketplace network */}
      <path
        d="M7 19.5c7.5-5.5 18.5-5.5 34 0"
        fill="none"
        className="stroke-accent"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity={0.92}
      />
      {/* L */}
      <path
        className="fill-primary-content"
        d="M10 12.5h5.5v18.5H25v5H10v-23.5z"
      />
      {/* M — geometric peaks */}
      <path
        className="fill-primary-content"
        d="M28 10h4v18l4-8 4 8V10h4v26h-4V18l-4 6-4-6v18h-4V10z"
      />
      {/* Spark */}
      <circle cx="39" cy="11.5" r="2.5" className="fill-accent" opacity={0.95} />
    </svg>
  );
}

const BADGE = {
  sm: "h-8 w-8 min-h-8 min-w-8 rounded-[10px] sm:h-9 sm:w-9",
  md: "h-9 w-9 min-h-9 min-w-9 rounded-[11px] sm:h-10 sm:w-10 md:h-11 md:w-11",
  lg: "h-10 w-10 min-h-10 min-w-10 rounded-xl sm:h-11 sm:w-11",
  xl: "h-11 w-11 min-h-11 min-w-11 rounded-xl sm:h-12 sm:w-12",
} as const;

type BadgeProps = {
  className?: string;
  badgeSize?: keyof typeof BADGE;
  markSize?: LucyMerchantMarkSize;
};

/** Gradient badge wrapping the mark — navbar & footer */
export function LucyMerchantMarkBadge({
  className,
  badgeSize = "md",
  markSize = "lg",
}: BadgeProps) {
  return (
    <div
      className={clsx(
        "relative flex shrink-0 items-center justify-center bg-gradient-to-br from-primary via-primary/92 to-accent shadow-lg shadow-primary/30 ring-1 ring-white/20",
        BADGE[badgeSize],
        className,
      )}
    >
      <LucyMerchantMark
        size={markSize}
        className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.12)]"
      />
    </div>
  );
}
