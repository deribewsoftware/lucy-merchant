"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function SupplierDeleteProductButton({
  productId,
  name,
}: {
  productId: string;
  name: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function performDelete() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          typeof data.error === "string" ? data.error : "Could not delete listing",
        );
        return;
      }
      setConfirmOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setConfirmOpen(true);
        }}
        disabled={busy}
        className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
      >
        {busy ? "…" : "Delete"}
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
            Comments and reviews for this product will be deleted.{" "}
            <span className="font-medium text-error/90">This cannot be undone.</span>
          </>
        }
        variant="danger"
        confirmLabel="Delete listing"
        cancelLabel="Keep listing"
        loading={busy}
        onConfirm={performDelete}
      />
    </>
  );
}
