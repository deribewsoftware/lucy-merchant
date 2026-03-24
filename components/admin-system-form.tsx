"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  HiOutlineBanknotes,
  HiOutlineBolt,
  HiOutlineSparkles,
  HiOutlineTicket,
} from "react-icons/hi2";
import {
  supplierCheckboxClass,
  supplierFormCardClass,
  supplierInputClass,
  supplierLabelClass,
  supplierPrimaryButtonClass,
  supplierSectionClass,
} from "@/components/supplier/form-styles";
import type { SystemConfig } from "@/lib/domain/types";

type Props = { initial: SystemConfig };

export function AdminSystemForm({ initial }: Props) {
  const router = useRouter();
  const [cfg, setCfg] = useState(initial);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const res = await fetch("/api/admin/system", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cfg),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMsg(data.error ?? "Save failed");
      return;
    }
    if (data.config) setCfg(data.config);
    router.refresh();
  }

  return (
    <form
      onSubmit={save}
      className={`${supplierFormCardClass} mt-6 max-w-2xl border-secondary/10 ring-secondary/5`}
    >
      <div className="mb-6 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
          <HiOutlineBolt className="h-6 w-6" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-base-content">
            Monetization & rules
          </h2>
          <p className="mt-0.5 text-sm text-base-content/55">
            Commission, posting points, featured listings, and fee bypass flags.
          </p>
        </div>
      </div>

      <div className={`${supplierSectionClass} space-y-5`}>
        <label className={supplierLabelClass}>
          <span className="inline-flex items-center gap-1.5 normal-case">
            <HiOutlineTicket className="h-3.5 w-3.5 text-primary" />
            Post product points cost
          </span>
          <input
            type="number"
            min={0}
            value={cfg.postProductPoints}
            onChange={(e) =>
              setCfg((c) => ({
                ...c,
                postProductPoints: Number(e.target.value),
              }))
            }
            className={supplierInputClass}
          />
        </label>
        <label className={supplierLabelClass}>
          <span className="inline-flex items-center gap-1.5 normal-case">
            <HiOutlineBanknotes className="h-3.5 w-3.5 text-success" />
            Order commission %
          </span>
          <input
            type="number"
            min={0}
            step="0.1"
            value={cfg.orderCommissionPercent}
            onChange={(e) =>
              setCfg((c) => ({
                ...c,
                orderCommissionPercent: Number(e.target.value),
              }))
            }
            className={supplierInputClass}
          />
        </label>
        <label className={supplierLabelClass}>
          <span className="inline-flex items-center gap-1.5 normal-case">
            <HiOutlineSparkles className="h-3.5 w-3.5 text-accent" />
            Featured listing cost (points)
          </span>
          <input
            type="number"
            min={0}
            value={cfg.featuredProductCost}
            onChange={(e) =>
              setCfg((c) => ({
                ...c,
                featuredProductCost: Number(e.target.value),
              }))
            }
            className={supplierInputClass}
          />
        </label>
      </div>

      <div className={`${supplierSectionClass} mt-5 space-y-4`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
          Overrides
        </p>
        <label className="flex cursor-pointer items-start gap-3 text-sm text-base-content">
          <input
            type="checkbox"
            checked={cfg.freePostingEnabled}
            onChange={(e) =>
              setCfg((c) => ({ ...c, freePostingEnabled: e.target.checked }))
            }
            className={supplierCheckboxClass}
          />
          <span>
            <span className="font-medium">Free product posting</span>
            <span className="mt-0.5 block text-xs text-base-content/55">
              Skip point deduction when suppliers publish SKUs.
            </span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 text-sm text-base-content">
          <input
            type="checkbox"
            checked={cfg.freeCommissionEnabled}
            onChange={(e) =>
              setCfg((c) => ({ ...c, freeCommissionEnabled: e.target.checked }))
            }
            className={supplierCheckboxClass}
          />
          <span>
            <span className="font-medium">Free commission on orders</span>
            <span className="mt-0.5 block text-xs text-base-content/55">
              Platform takes no commission cut on new checkouts.
            </span>
          </span>
        </label>
      </div>

      {msg && (
        <p className="mt-4 rounded-xl border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
          {msg}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className={`${supplierPrimaryButtonClass} mt-6`}
      >
        {loading ? "Saving…" : "Save configuration"}
      </button>
    </form>
  );
}
