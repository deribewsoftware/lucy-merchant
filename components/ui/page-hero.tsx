import type { ReactNode } from "react";

type Props = {
  eyebrow?: string;
  title: string;
  lead: string;
  children?: ReactNode;
  /** e.g. animated SVG */
  visual?: ReactNode;
  className?: string;
};

/**
 * Full-width hero row: copy + optional visual. Use inside a container.
 */
export function PageHero({
  eyebrow,
  title,
  lead,
  children,
  visual,
  className = "",
}: Props) {
  return (
    <div
      className={`grid items-center gap-8 lg:grid-cols-[1fr_min(42%,420px)] lg:gap-12 ${className}`}
    >
      <div className="min-w-0 space-y-5">
        {eyebrow && <p className="lm-eyebrow">{eyebrow}</p>}
        <h1 className="lm-heading-display text-balance">{title}</h1>
        <p className="lm-body-lead max-w-xl text-pretty">{lead}</p>
        {children && <div className="flex flex-wrap gap-3 pt-1">{children}</div>}
      </div>
      {visual && (
        <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
          {visual}
        </div>
      )}
    </div>
  );
}
