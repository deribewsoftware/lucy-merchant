"use client";

import clsx from "clsx";
import type { ReactNode } from "react";
import {
  isPresenceOnline,
  presenceFullLabel,
  presenceShortLabel,
} from "@/lib/presence-label";

type Size = "sm" | "md" | "lg";

/**
 * Dot: center sits on the circular outline at ~45° (top-right arc).
 * Offset from avatar center = R×cos(45°) ≈ R×0.707, with R = half of face size.
 */
const sizeClasses: Record<
  Size,
  {
    shell: string;
    face: string;
    dot: string;
  }
> = {
  sm: {
    shell: "h-8 w-8 min-h-8 min-w-8",
    face: "h-8 w-8 min-h-8 min-w-8",
    dot: "left-1/2 top-1/2 z-30 h-2.5 min-h-2.5 w-2.5 min-w-2.5 -translate-x-1/2 -translate-y-1/2 translate-x-[11.31px] -translate-y-[11.31px] border-[2px]",
  },
  md: {
    shell: "h-10 w-10 min-h-10 min-w-10",
    face: "h-10 w-10 min-h-10 min-w-10",
    dot: "left-1/2 top-1/2 z-30 h-3 min-h-3 w-3 min-w-3 -translate-x-1/2 -translate-y-1/2 translate-x-[14.14px] -translate-y-[14.14px] border-2",
  },
  lg: {
    shell: "h-11 w-11 min-h-11 min-w-11",
    face: "h-11 w-11 min-h-11 min-w-11",
    dot: "left-1/2 top-1/2 z-30 h-3.5 min-h-3.5 w-3.5 min-w-3.5 -translate-x-1/2 -translate-y-1/2 translate-x-[15.56px] -translate-y-[15.56px] border-[2px]",
  },
};

type Props = {
  children: ReactNode;
  /** Server-reported last activity (ISO). Omit when using `selfOnline` only. */
  lastSeenAt?: string;
  /** Current user: use heartbeat / local online state */
  selfOnline?: boolean;
  size?: Size;
  /** Face / gradient classes */
  className?: string;
  /** Ring around avatar (theme token). Default: `ring-2 ring-background`. */
  ringClassName?: string;
  /** Presence dot border (e.g. DaisyUI `border-base-100`). */
  dotClassName?: string;
  /** Visually hidden label for screen readers */
  ariaLabel?: string;
  /** Hide from assistive tech (name is announced in the chat header row) */
  decorative?: boolean;
};

/**
 * Circular avatar with a presence dot centered on the top-right arc of the outline.
 * Shell uses overflow-visible so the dot is not clipped by flex parents.
 */
export function PresenceAvatar({
  children,
  lastSeenAt,
  selfOnline = false,
  size = "md",
  className,
  ringClassName = "ring-2 ring-background",
  dotClassName = "border-background",
  ariaLabel,
  decorative = false,
}: Props) {
  const online =
    selfOnline || (lastSeenAt != null && isPresenceOnline(lastSeenAt));
  const hasServerTime = Boolean(lastSeenAt);
  const title =
    selfOnline && !hasServerTime
      ? "Online — active in the last 2 minutes"
      : lastSeenAt
        ? presenceFullLabel(lastSeenAt)
        : "Away";
  const short =
    selfOnline && !hasServerTime
      ? "Online"
      : lastSeenAt
        ? presenceShortLabel(lastSeenAt)
        : "Away";

  const s = sizeClasses[size];

  return (
    <div
      className={clsx(
        "relative isolate inline-flex shrink-0 overflow-visible",
        s.shell,
      )}
      title={title}
      aria-hidden={decorative ? true : undefined}
    >
      <span
        className={clsx(
          "relative z-0 flex items-center justify-center overflow-hidden rounded-full text-[10px] font-bold",
          s.face,
          ringClassName,
          className,
        )}
        aria-label={decorative ? undefined : ariaLabel ?? short}
      >
        {children}
      </span>
      <span
        className={clsx(
          "pointer-events-none absolute rounded-full border-solid shadow-sm",
          s.dot,
          dotClassName,
          online
            ? "bg-success shadow-[0_0_0_1px_rgba(34,197,94,0.3)]"
            : "bg-muted-foreground/60",
        )}
        aria-hidden
      />
    </div>
  );
}

/** Text line for menus / headers — pairs with PresenceAvatar */
export function PresenceStatusLine({
  lastSeenAt,
  selfOnline,
}: {
  lastSeenAt?: string;
  selfOnline?: boolean;
}) {
  const online =
    Boolean(selfOnline) ||
    (lastSeenAt != null && isPresenceOnline(lastSeenAt));
  const label = online
    ? "Online"
    : lastSeenAt
      ? presenceShortLabel(lastSeenAt)
      : "Away";

  return (
    <span className="inline-flex min-w-0 max-w-full flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
      <span
        className={clsx(
          "h-2 w-2 shrink-0 rounded-full",
          online ? "bg-success" : "bg-muted-foreground/45",
        )}
        aria-hidden
      />
      <span
        className={clsx(
          "min-w-0 break-words leading-snug",
          online ? "text-emerald-600 dark:text-emerald-400" : undefined,
        )}
      >
        {label}
      </span>
    </span>
  );
}
