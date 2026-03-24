import type { ReactNode } from "react";

export function SupplierFormSectionTitle({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4 flex gap-3 border-b border-base-300/80 pb-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </span>
      <div>
        <h2 className="text-sm font-semibold text-base-content">{title}</h2>
        {subtitle ? (
          <p className="mt-0.5 text-xs text-base-content/60">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
