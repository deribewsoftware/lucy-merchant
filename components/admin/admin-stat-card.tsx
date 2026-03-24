import type { ComponentType } from "react"

type IconComponent = ComponentType<{ className?: string }>

const accents = {
  primary: {
    ring: "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
    blob: "bg-primary/5",
    icon: "bg-primary/10 text-primary",
  },
  secondary: {
    ring: "hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5",
    blob: "bg-accent/5",
    icon: "bg-accent/10 text-accent",
  },
  success: {
    ring: "hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/5",
    blob: "bg-green-500/5",
    icon: "bg-green-500/10 text-green-500",
  },
  warning: {
    ring: "hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5",
    blob: "bg-amber-500/5",
    icon: "bg-amber-500/10 text-amber-500",
  },
} as const

type Accent = keyof typeof accents

type Props = {
  eyebrow: string
  value: React.ReactNode
  footnote: React.ReactNode
  icon: IconComponent
  accent: Accent
  valueSize?: "lg" | "xl"
  valueClassName?: string
}

export function AdminStatCard({
  eyebrow,
  value,
  footnote,
  icon: Icon,
  accent,
  valueSize = "xl",
  valueClassName,
}: Props) {
  const a = accents[accent]
  const valueCls =
    valueSize === "lg"
      ? "text-xl font-bold tabular-nums tracking-tight sm:text-2xl lg:text-3xl"
      : "text-2xl font-bold tabular-nums tracking-tight sm:text-3xl"

  return (
    <div
      className={`group relative min-w-0 overflow-hidden rounded-2xl border border-border/50 bg-card/80 p-4 shadow-sm transition-all duration-300 ${a.ring} sm:p-5`}
    >
      {/* Hover gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      
      <div className="relative flex items-start gap-3 sm:gap-4">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${a.icon}`}
        >
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {eyebrow}
          </p>
          <div
            className={`mt-2 ${valueCls} ${valueClassName ?? "text-foreground"}`}
          >
            {value}
          </div>
          <p className="mt-2 text-xs leading-snug text-muted-foreground">
            {footnote}
          </p>
        </div>
      </div>
      
      {/* Background decoration */}
      <div
        className={`pointer-events-none absolute -right-6 -bottom-10 h-24 w-24 rounded-full blur-2xl ${a.blob}`}
      />
    </div>
  )
}
