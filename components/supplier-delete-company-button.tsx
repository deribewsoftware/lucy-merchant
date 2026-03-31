"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Variant = "default" | "inline";

export function SupplierDeleteCompanyButton({
  companyId,
  name,
  productCount,
  companyVerified = false,
  variant = "default",
  /** When false, only refresh (e.g. on the companies list). When true, go to /supplier/companies after delete. */
  navigateToListAfterDelete = true,
}: {
  companyId: string;
  name: string;
  productCount: number;
  /** When true, deletion is only allowed after all product listings are removed. */
  companyVerified?: boolean;
  variant?: Variant;
  navigateToListAfterDelete?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mustClearProductsFirst = companyVerified && productCount > 0;

  const productLine =
    productCount === 0
      ? "This company has no product listings."
      : productCount === 1
        ? companyVerified
          ? "Remove this listing before you can remove the company."
          : "1 product listing will be permanently removed."
        : companyVerified
          ? `Remove all ${productCount} listings before you can remove the company.`
          : `${productCount} product listings will be permanently removed.`;

  async function performDelete() {
    setBusy(true);
    try {
      const res = await fetch(`/api/companies/${companyId}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(typeof data.error === "string" ? data.error : "Could not remove company");
        return;
      }
      setConfirmOpen(false);
      if (navigateToListAfterDelete) {
        router.push("/supplier/companies");
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const base =
    variant === "inline"
      ? "rounded-lg px-2.5 py-1.5 text-xs font-semibold text-error/90 ring-1 ring-error/20 transition hover:bg-error/10 disabled:opacity-50"
      : "rounded-xl border border-error/40 bg-base-100 px-4 py-2.5 text-sm font-semibold text-error transition hover:bg-error/10 disabled:opacity-50";

  return (
    <>
      <button
        type="button"
        title={
          mustClearProductsFirst
            ? "Remove all product listings for this verified company first"
            : undefined
        }
        onClick={() => {
          if (mustClearProductsFirst) return;
          setError(null);
          setConfirmOpen(true);
        }}
        disabled={busy || mustClearProductsFirst}
        className={base}
      >
        {busy ? "Removing…" : variant === "inline" ? "Remove" : "Remove company"}
      </button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(o) => {
          if (!o) setError(null);
          setConfirmOpen(o);
        }}
        title={`Remove “${name}”?`}
        errorMessage={error}
        description={
          <>
            <span className="block">{productLine}</span>
            <span className="mt-2 block text-base-content/65">
              {companyVerified && productCount === 0 ? (
                <>
                  Past orders may still reference this company on line items; the public profile will be
                  removed.{" "}
                </>
              ) : (
                <>
                  Company reviews and cart lines for those products will be removed. Past
                  orders will still show line items, but the company profile will be gone.{" "}
                </>
              )}
              <span className="font-medium text-error/90">This cannot be undone.</span>
            </span>
          </>
        }
        variant="danger"
        confirmLabel="Remove company"
        cancelLabel="Keep company"
        loading={busy}
        onConfirm={performDelete}
      />
    </>
  );
}
