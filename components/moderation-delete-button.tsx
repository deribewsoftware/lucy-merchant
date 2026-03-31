"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { HiOutlineTrash } from "react-icons/hi2";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Props = {
  apiPath: string;
  label?: string;
};

export function ModerationDeleteButton({
  apiPath,
  label = "Remove",
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function performRemove() {
    setLoading(true);
    try {
      const res = await fetch(apiPath, { method: "DELETE" });
      if (res.ok) {
        setConfirmOpen(false);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={loading}
        className="inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-xl border border-error/30 bg-error/5 px-3 py-2 text-xs font-semibold text-error transition hover:bg-error/10 disabled:opacity-50 sm:self-center"
      >
        <HiOutlineTrash className="h-4 w-4" />
        {loading ? "…" : label}
      </button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Remove this content?"
        description={
          <span className="font-medium text-error/90">This cannot be undone.</span>
        }
        variant="danger"
        confirmLabel="Remove"
        cancelLabel="Cancel"
        loading={loading}
        onConfirm={performRemove}
      />
    </>
  );
}
