import type { ReactNode } from "react";

type Props = {
  /** Small uppercase label above the title */
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  /** Right-aligned slot (e.g. link or tabs) */
  action?: ReactNode;
  className?: string;
};

/**
 * Consistent section typography for marketing and catalog pages.
 */
export function SectionHeader({
  eyebrow,
  title,
  description,
  icon,
  action,
  className = "",
}: Props) {
  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between ${className}`}
    >
      <div className="min-w-0 space-y-1">
        {eyebrow && (
          <p className="lm-eyebrow">{eyebrow}</p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {icon && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {icon}
            </span>
          )}
          <h2 className="lm-heading-section">{title}</h2>
        </div>
        {description && (
          <p className="lm-body-muted max-w-2xl text-pretty">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
