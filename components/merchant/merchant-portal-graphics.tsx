/** Decorative SVGs for merchant portal (theme-aware via currentColor). */

export function MerchantHeroBackdrop({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden rounded-2xl ${className}`}
      aria-hidden
    >
      <svg
        className="absolute -right-4 -top-6 h-40 w-48 text-secondary/25"
        viewBox="0 0 180 160"
        fill="none"
      >
        <path
          d="M40 120h120M40 120l20-48h80l20 48"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect
          x="56"
          y="52"
          width="68"
          height="44"
          rx="6"
          stroke="currentColor"
          strokeWidth="1.2"
          opacity="0.85"
        />
        <circle cx="90" cy="28" r="10" stroke="currentColor" strokeWidth="1.2" />
        <path
          d="M90 38v14M76 62h28"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
      <svg
        className="absolute -bottom-2 left-2 h-28 w-44 text-primary/20"
        viewBox="0 0 176 100"
        fill="none"
      >
        <path
          d="M12 78c22-14 42-20 64-12s48 2 76-22"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <rect
          x="24"
          y="32"
          width="128"
          height="36"
          rx="8"
          stroke="currentColor"
          strokeWidth="1.2"
          opacity="0.7"
        />
        <path
          d="M40 48h32M40 58h56"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.5"
        />
      </svg>
    </div>
  );
}

export function MerchantSpendSparkline({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 40" fill="none" aria-hidden>
      <path
        d="M4 28 L22 22 L40 26 L58 14 L76 18 L94 10 L116 6"
        className="stroke-secondary"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="116" cy="6" r="2.5" className="fill-secondary" />
    </svg>
  );
}
