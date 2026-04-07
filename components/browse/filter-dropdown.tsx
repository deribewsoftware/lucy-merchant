import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

export function FilterDropdown({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: ReactNode;
}) {
  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg border border-border/45 bg-card px-3 py-2 text-sm font-medium transition-all hover:border-primary/25 hover:bg-muted [&::-webkit-details-marker]:hidden">
        <span className="text-xs text-muted-foreground">{label}:</span>
        <span className="max-w-[10rem] truncate text-foreground">{value}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="absolute left-0 top-[calc(100%+4px)] z-30 min-w-[12rem] max-w-[min(100vw-2rem,20rem)] rounded-lg border border-border/45 bg-card p-1 shadow-xl">
        {children}
      </div>
    </details>
  );
}
