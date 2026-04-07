"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { HiOutlineTrash } from "react-icons/hi2";
import {
  DATA_CLEAR_FEATURES,
  type DataClearFeatureId,
} from "@/lib/domain/data-clear-features";
import {
  supplierFormCardClass,
  supplierSectionClass,
} from "@/components/supplier/form-styles";

export function AdminDataClearPanel() {
  const router = useRouter();
  const [busy, setBusy] = useState<DataClearFeatureId | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function onClear(id: DataClearFeatureId, confirmMessage: string) {
    if (!window.confirm(confirmMessage)) return;
    setBusy(id);
    setMsg(null);
    const res = await fetch("/api/admin/data/clear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feature: id }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      setMsg(data.error ?? "Request failed");
      return;
    }
    setMsg(`Cleared: ${DATA_CLEAR_FEATURES.find((f) => f.id === id)?.title ?? id}`);
    router.refresh();
  }

  return (
    <section
      className={`${supplierFormCardClass} mt-10 max-w-3xl border-error/15 ring-error/5`}
    >
      <div className={supplierSectionClass}>
        <div className="mb-6 flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-error/10 text-error">
            <HiOutlineTrash className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-base-content">
              Data management
            </h2>
            <p className="mt-0.5 text-sm text-base-content/55">
              System administrators only. Each action removes data for that area
              from the app store (and MongoDB when configured). A confirmation
              runs before anything is deleted.
            </p>
          </div>
        </div>

        {msg ? (
          <p className="mb-4 rounded-xl border border-success/25 bg-success/5 px-4 py-3 text-sm text-base-content">
            {msg}
          </p>
        ) : null}

        <ul className="divide-y divide-base-300/80 rounded-2xl border border-base-300/80 bg-base-100/50">
          {DATA_CLEAR_FEATURES.map((f) => (
            <li
              key={f.id}
              className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between ${
                f.id === "all"
                  ? "bg-error/5 ring-1 ring-inset ring-error/15"
                  : ""
              }`}
            >
              <div className="min-w-0">
                <p className="font-medium text-base-content">{f.title}</p>
                <p className="mt-1 text-sm text-base-content/55">{f.description}</p>
              </div>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void onClear(f.id, f.confirmMessage)}
                className={
                  f.id === "all"
                    ? "btn btn-error shrink-0 gap-2 rounded-xl"
                    : "btn btn-outline btn-error shrink-0 gap-2 rounded-xl border-error/40"
                }
              >
                {busy === f.id ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <HiOutlineTrash className="h-4 w-4" />
                )}
                {f.id === "all" ? "Clear all" : "Clear"}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
