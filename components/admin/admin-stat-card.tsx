import type { ComponentType } from "react";

type IconComponent = ComponentType<{ className?: string }>;

const accents = {
  primary: {
    ring: "hover:ring-primary/20",
    blob: "bg-primary/5",
    icon: "bg-primary/10 text-primary",
  },
  secondary: {
    ring: "hover:ring-secondary/20",
    blob: "bg-secondary/5",
    icon: "bg-secondary/10 text-secondary",
  },
  success: {
    ring: "hover:ring-success/25",
    blob: "bg-success/5",
    icon: "bg-success/10 text-success",
  },
  warning: {
    ring: "hover:ring-warning/25",
    blob: "bg-warning/5",
    icon: "bg-warning/10 text-warning",
  },
} as const;

type Accent = keyof typeof accents;

type Props = {
  eyebrow: string;
  /** Main metric — string allows "1,234 ETB" style */
  value: React.ReactNode;
  footnote: React.ReactNode;
  icon: IconComponent;
  accent: Accent;
  /** Use smaller primary number on narrow screens when value is long */
  valueSize?: "lg" | "xl";
  /** e.g. text-success for commission */
  valueClassName?: string;
};

export function AdminStatCard({
  eyebrow,
  value,
  footnote,
  icon: Icon,
  accent,
  valueSize = "xl",
  valueClassName,
}: Props) {
  const a = accents[accent];
  const valueCls =
    valueSize === "lg"
      ? "text-xl font-bold tabular-nums tracking-tight sm:text-2xl lg:text-3xl"
      : "text-2xl font-bold tabular-nums tracking-tight sm:text-3xl";

  return (
    <div
      className={`group relative min-w-0 overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm ring-1 ring-base-300/25 transition ${a.ring} sm:p-5`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-base-content/50 sm:text-xs">
            {eyebrow}
          </p>
          <div
            className={`mt-1.5 sm:mt-2 ${valueCls} ${valueClassName ?? "text-base-content"}`}
          >
            {value}
          </div>
          <p className="mt-1.5 text-[11px] leading-snug text-base-content/55 sm:text-xs">
            {footnote}
          </p>
        </div>
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${a.icon}`}
        >
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
        </span>
      </div>
      <div
        className={`pointer-events-none absolute -right-6 -bottom-10 h-24 w-24 rounded-full blur-2xl ${a.blob}`}
      />
    </div>
  );
}
