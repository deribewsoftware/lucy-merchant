"use client";

import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  orderId: string;
  canOpen: boolean;
  openedAt?: string;
  reason?: string;
};

export function MerchantOrderDispute({
  orderId,
  canOpen,
  openedAt,
  reason,
}: Props) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  if (openedAt) {
    return (
      <div className="rounded-xl border border-amber-500/35 bg-amber-500/[0.06] p-4 shadow-sm ring-1 ring-amber-500/15 sm:p-5">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-200">
            <AlertTriangle className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-display text-sm font-bold text-amber-900 dark:text-amber-100">
              Delivery dispute recorded
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Submitted {new Date(openedAt).toLocaleString()}
            </p>
            {reason ? (
              <p className="mt-3 whitespace-pre-wrap rounded-lg border border-border/50 bg-background/80 p-3 text-sm text-foreground">
                {reason}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-muted-foreground">
              Our team and the supplier have been notified. You can add details in order chat if
              needed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!canOpen) return null;

  async function submit() {
    setLoading(true);
    setMsg(null);
    const res = await fetch(`/api/orders/${orderId}/dispute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: text.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMsg(data.error ?? "Could not submit dispute");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <div className="rounded-xl border border-destructive/30 bg-destructive/[0.04] p-4 shadow-sm ring-1 ring-destructive/15 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="font-display text-sm font-bold text-foreground">
                Delivery is late
              </p>
              <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">
                The supplier’s stated business-day window has passed and the order is not marked
                delivered. You can open a dispute so the platform can review.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="btn btn-outline btn-error btn-sm shrink-0 border-destructive/40 min-h-10"
          >
            Open delivery dispute
          </button>
        </div>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[1px]"
          role="presentation"
          onClick={() => !loading && setOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border/50 bg-card p-0 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dispute-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-border/40 bg-muted/30 px-5 py-4">
              <h3 id="dispute-title" className="font-display text-lg font-bold text-foreground">
                Open delivery dispute
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Describe what happened (minimum 20 characters). This is shared with admins and the
                supplier.
              </p>
            </div>
            <div className="px-5 py-4">
              <textarea
                className="textarea textarea-bordered min-h-[120px] w-full text-sm"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g. Order accepted on [date] but still not delivered after the stated lead time…"
                disabled={loading}
              />
              {msg ? (
                <p className="mt-2 text-xs text-destructive" role="alert">
                  {msg}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-border/40 bg-muted/20 px-5 py-4">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={loading}
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-error btn-sm"
                disabled={loading || text.trim().length < 20}
                onClick={() => void submit()}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : null}
                Submit dispute
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
