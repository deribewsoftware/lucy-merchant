"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import clsx from "clsx";

type Props = {
  className?: string;
  /** Icon only — hides the “Alerts” label (e.g. compact navbar). */
  compact?: boolean;
};

export function NotificationBell({ className, compact = false }: Props) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch("/api/notifications?count=1", {
          credentials: "same-origin",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && typeof data.unread === "number") {
          setUnread(data.unread);
        }
      } catch {
        /* ignore */
      }
    }
    poll();
    const t = setInterval(poll, 45_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const pill = clsx(
    "btn btn-ghost btn-sm relative gap-2 rounded-full border border-base-300/50 normal-case",
    "hover:border-primary/30 hover:bg-primary/5",
    className,
  );

  return (
    <Link href="/notifications" className={pill} aria-label="Notifications">
      <Bell className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
      {!compact ? (
        <span className="hidden lg:inline">Alerts</span>
      ) : null}
      {unread > 0 ? (
        <span className="badge badge-error badge-xs absolute -right-0.5 -top-0.5 min-w-[1.1rem] border-2 border-base-100 px-0.5 text-[10px]">
          {unread > 99 ? "99+" : unread}
        </span>
      ) : null}
    </Link>
  );
}
