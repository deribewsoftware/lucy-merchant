"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  HiOutlineBanknotes,
  HiOutlineBolt,
  HiOutlineBuildingOffice2,
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

const EXAMPLE_ORDER_ETB = 10_000;

export function AdminSystemForm({ initial }: Props) {
  const router = useRouter();
  const [cfg, setCfg] = useState(initial);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const commissionPreviewEtb = cfg.freeCommissionEnabled
    ? 0
    : Math.round(EXAMPLE_ORDER_ETB * (cfg.orderCommissionPercent / 100) * 100) /
      100;
  const supplierCommissionPreviewEtb = cfg.freeSupplierCommissionEnabled
    ? 0
    : Math.round(
        EXAMPLE_ORDER_ETB * (cfg.supplierOrderCommissionPercent / 100) * 100,
      ) / 100;

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

      <div className="mt-5 rounded-2xl border border-success/25 bg-gradient-to-br from-success/5 to-base-200/30 p-5 shadow-sm ring-1 ring-success/10">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-success/15 text-success">
            <HiOutlineBanknotes className="h-6 w-6" />
          </span>
          <div>
            <h3 className="text-base font-semibold text-base-content">
              Merchant commission fee (merchants → platform)
            </h3>
            <p className="mt-0.5 text-sm text-base-content/60">
              After delivery, merchants transfer this percentage of the order total
              to your Ethiopian platform accounts (CBE, Awash, Telebirr, etc.).
              Suppliers are paid for goods separately; this fee is only for the
              marketplace. Together with the supplier commission fee, both must be
              paid to the platform and recorded before an order can be completed when
              each applies; unpaid fees suspend that party&apos;s account until settled.
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <label className={supplierLabelClass}>
            <span className="inline-flex items-center gap-1.5 normal-case">
              Commission rate (% of order total)
            </span>
            <input
              type="number"
              min={0}
              step="0.1"
              disabled={cfg.freeCommissionEnabled}
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
          <div className="rounded-xl border border-base-300/80 bg-base-100/80 px-3 py-2.5 text-sm text-base-content/80">
            <span className="font-medium text-base-content">Preview: </span>
            {cfg.freeCommissionEnabled ? (
              <span>Commission waived — 0 ETB on a sample order.</span>
            ) : (
              <span>
                A {EXAMPLE_ORDER_ETB.toLocaleString()} ETB order →{" "}
                <span className="font-semibold tabular-nums text-success">
                  ~{commissionPreviewEtb.toLocaleString()} ETB
                </span>{" "}
                platform commission
              </span>
            )}
          </div>
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
              <span className="font-medium">Waive merchant commission fee</span>
              <span className="mt-0.5 block text-xs text-base-content/55">
                New checkouts will have 0% merchant fee until you turn this off.
              </span>
            </span>
          </label>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-500/[0.06] to-base-200/30 p-5 shadow-sm ring-1 ring-violet-500/10">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-700 dark:text-violet-300">
            <HiOutlineBuildingOffice2 className="h-6 w-6" />
          </span>
          <div>
            <h3 className="text-base font-semibold text-base-content">
              Supplier commission fee (suppliers → platform)
            </h3>
            <p className="mt-0.5 text-sm text-base-content/60">
              Each supplier checkout is one company per order. This percentage
              applies to that order&apos;s line subtotal (goods value). Suppliers pay
              after delivery; the buyer cannot complete until merchant and supplier
              platform fees are recorded when they apply. Unpaid fees suspend the
              relevant account until settled.
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <label className={supplierLabelClass}>
            <span className="inline-flex items-center gap-1.5 normal-case">
              Rate (% of supplier order subtotal)
            </span>
            <input
              type="number"
              min={0}
              step="0.1"
              disabled={cfg.freeSupplierCommissionEnabled}
              value={cfg.supplierOrderCommissionPercent}
              onChange={(e) =>
                setCfg((c) => ({
                  ...c,
                  supplierOrderCommissionPercent: Number(e.target.value),
                }))
              }
              className={supplierInputClass}
            />
          </label>
          <div className="rounded-xl border border-base-300/80 bg-base-100/80 px-3 py-2.5 text-sm text-base-content/80">
            <span className="font-medium text-base-content">Preview: </span>
            {cfg.freeSupplierCommissionEnabled ? (
              <span>Supplier commission waived — 0 ETB on a sample order.</span>
            ) : (
              <span>
                A {EXAMPLE_ORDER_ETB.toLocaleString()} ETB supplier subtotal →{" "}
                <span className="font-semibold tabular-nums text-violet-700 dark:text-violet-300">
                  ~{supplierCommissionPreviewEtb.toLocaleString()} ETB
                </span>{" "}
                supplier fee
              </span>
            )}
          </div>
          <label className="flex cursor-pointer items-start gap-3 text-sm text-base-content">
            <input
              type="checkbox"
              checked={cfg.freeSupplierCommissionEnabled}
              onChange={(e) =>
                setCfg((c) => ({
                  ...c,
                  freeSupplierCommissionEnabled: e.target.checked,
                }))
              }
              className={supplierCheckboxClass}
            />
            <span>
              <span className="font-medium">Waive supplier commission</span>
              <span className="mt-0.5 block text-xs text-base-content/55">
                New checkouts will charge suppliers 0% until you turn this off.
              </span>
            </span>
          </label>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-warning/30 bg-warning/5 p-5 shadow-sm ring-1 ring-warning/10">
        <div className="mb-3">
          <h3 className="text-base font-semibold text-base-content">
            Commission payment grace period
          </h3>
          <p className="mt-0.5 text-sm text-base-content/60">
            Hours after delivery before unpaid platform commission suspends the
            merchant or supplier account (when a fee applies). Each delivery
            stores a deadline from this setting.
          </p>
        </div>
        <label className={supplierLabelClass}>
          <span>Grace period (hours, 1–8760)</span>
          <input
            type="number"
            min={1}
            max={8760}
            step={1}
            value={cfg.commissionPaymentGraceHours}
            onChange={(e) =>
              setCfg((c) => ({
                ...c,
                commissionPaymentGraceHours: Number(e.target.value),
              }))
            }
            className={supplierInputClass}
          />
        </label>
      </div>

      <div className={`${supplierSectionClass} mt-6 space-y-5`}>
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
