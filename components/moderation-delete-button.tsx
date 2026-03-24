"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { HiOutlineTrash } from "react-icons/hi2";

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

  async function remove() {
    if (!confirm("Remove this content? This cannot be undone.")) return;
    setLoading(true);
    const res = await fetch(apiPath, { method: "DELETE" });
    setLoading(false);
    if (res.ok) router.refresh();
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={loading}
      className="inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-xl border border-error/30 bg-error/5 px-3 py-2 text-xs font-semibold text-error transition hover:bg-error/10 disabled:opacity-50 sm:self-center"
    >
      <HiOutlineTrash className="h-4 w-4" />
      {loading ? "…" : label}
    </button>
  );
}
