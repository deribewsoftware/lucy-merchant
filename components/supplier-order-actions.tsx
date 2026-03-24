"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  defaultSupplierNextChoice,
  supplierAllowedNextStatuses,
} from "@/lib/domain/order-flow";
import type { OrderStatus } from "@/lib/domain/types";

type Props = { orderId: string; current: OrderStatus };

export function SupplierOrderActions({ orderId, current }: Props) {
  const router = useRouter();
  const allowed = supplierAllowedNextStatuses(current);
  const defaultPick =
    defaultSupplierNextChoice(current) ?? allowed[0] ?? ("rejected" as const);
  const [status, setStatus] = useState<OrderStatus>(defaultPick);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const a = supplierAllowedNextStatuses(current);
    const next =
      defaultSupplierNextChoice(current) ?? a[0] ?? ("rejected" as const);
    setStatus(next);
  }, [current]);

  if (current === "completed" || current === "rejected") {
    return (
      <span className="text-xs text-zinc-500">
        Closed ({current.replace("_", " ")})
      </span>
    );
  }

  if (current === "delivered") {
    return (
      <span className="max-w-xs text-xs text-zinc-500">
        Delivered — the buyer will mark this order complete. You cannot change
        status now.
      </span>
    );
  }

  if (allowed.length === 0) {
    return (
      <span className="text-xs text-zinc-500">
        Current:{" "}
        <span className="font-medium capitalize">
          {current.replace("_", " ")}
        </span>
      </span>
    );
  }

  async function save() {
    setLoading(true);
    setMsg(null);
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMsg(data.error ?? "Update failed");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex max-w-md flex-col items-end gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <p className="w-full text-right text-xs text-zinc-500 sm:w-auto sm:text-left">
        Now:{" "}
        <span className="font-medium capitalize text-zinc-700 dark:text-zinc-300">
          {current.replace("_", " ")}
        </span>
        {" · "}Move to:
      </p>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus)}
          className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm capitalize dark:border-zinc-700 dark:bg-zinc-950"
        >
          {allowed.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={loading}
          onClick={save}
          className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {loading ? "Saving…" : "Update"}
        </button>
      </div>
      {msg && (
        <span className="w-full text-right text-xs text-red-600">{msg}</span>
      )}
    </div>
  );
}
