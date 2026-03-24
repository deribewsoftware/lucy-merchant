"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MarkAllNotificationsRead() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
        credentials: "same-origin",
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="btn btn-outline btn-sm"
    >
      {busy ? "Updating…" : "Mark all read"}
    </button>
  );
}

type RowProps = { id: string; read: boolean };

export function NotificationMarkReadButton({ id, read }: RowProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (read) {
    return (
      <span className="badge badge-ghost badge-sm shrink-0">Read</span>
    );
  }

  async function onClick() {
    setBusy(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
        credentials: "same-origin",
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="btn btn-ghost btn-xs shrink-0"
    >
      {busy ? "…" : "Mark read"}
    </button>
  );
}
