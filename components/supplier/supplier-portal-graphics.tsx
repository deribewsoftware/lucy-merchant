/** Decorative SVGs for supplier portal (theme-aware via currentColor). */

export function SupplierHeroBackdrop({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden rounded-2xl ${className}`}
      aria-hidden
    >
      <svg
        className="absolute -right-6 -top-8 h-36 w-56"
        viewBox="0 0 200 140"
        fill="none"
      >
        <circle
          cx="160"
          cy="30"
          r="48"
          className="stroke-primary/35"
          strokeWidth="1.5"
        />
        <circle
          cx="130"
          cy="70"
          r="32"
          className="stroke-accent/30"
          strokeWidth="1.2"
          opacity="0.85"
        />
        <path
          d="M20 120c28-18 52-22 80-8s56 4 88-28"
          className="stroke-secondary/40"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.55"
        />
      </svg>
      <svg
        className="absolute -bottom-4 left-4 h-24 w-40"
        viewBox="0 0 160 96"
        fill="none"
      >
        <rect
          x="8"
          y="24"
          width="144"
          height="56"
          rx="12"
          className="stroke-primary/30"
          strokeWidth="1.2"
        />
        <path
          d="M24 48h40M24 60h72"
          className="stroke-accent/35"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.75"
        />
      </svg>
    </div>
  );
}

export function SupplierAnalyticsSparkline({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 40" fill="none" aria-hidden>
      <path
        d="M4 32 L24 18 L44 26 L64 8 L84 20 L104 12 L116 6"
        className="stroke-primary"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="116" cy="6" r="2.5" className="fill-accent" />
    </svg>
  );
}
