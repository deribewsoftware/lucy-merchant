"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { HiOutlinePlusCircle, HiOutlineSquares2X2 } from "react-icons/hi2";
import { ParentCategoryPicker } from "@/components/parent-category-picker";
import {
  supplierFormCardClass,
  supplierGhostButtonClass,
  supplierInputClass,
  supplierLabelClass,
  supplierPrimaryButtonClass,
} from "@/components/supplier/form-styles";
import type { Category } from "@/lib/domain/types";

type Props = { categories: Category[] };

export function AdminAddCategoryForm({ categories }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        parentId: parentId === "" ? null : parentId,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMsg(data.error ?? "Failed to add category");
      return;
    }
    setName("");
    setParentId("");
    router.refresh();
  }

  return (
    <form
      onSubmit={submit}
      className={`${supplierFormCardClass} border-primary/10 ring-primary/5`}
    >
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <HiOutlinePlusCircle className="h-6 w-6" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-base-content">
            Add category
          </h2>
          <p className="mt-0.5 text-sm text-base-content/55">
            Creates a node in the taxonomy tree (optional parent).
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <label className={supplierLabelClass}>
          Name
          <input
            required
            placeholder="e.g. Beverages"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={supplierInputClass}
          />
        </label>

        <div className="space-y-2">
          <span className={`${supplierLabelClass} mb-0`}>
            <span className="inline-flex items-center gap-1.5">
              <HiOutlineSquares2X2 className="h-3.5 w-3.5 opacity-60" />
              Parent (optional)
            </span>
          </span>
          <ParentCategoryPicker
            options={categories}
            value={parentId}
            onChange={setParentId}
            rootOptionLabel="Top-level category"
          />
        </div>

        {msg && (
          <p className="rounded-xl border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
            {msg}
          </p>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="submit"
            disabled={loading}
            className={supplierPrimaryButtonClass}
          >
            {loading ? "Saving…" : "Create category"}
          </button>
          <button
            type="button"
            className={supplierGhostButtonClass}
            disabled={loading}
            onClick={() => {
              setName("");
              setParentId("");
              setMsg(null);
            }}
          >
            Reset form
          </button>
        </div>
      </div>
    </form>
  );
}
