"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineXMark,
} from "react-icons/hi2";
import {
  supplierGhostButtonClass,
  supplierInputClass,
  supplierPrimaryButtonClass,
  supplierSelectClass,
} from "@/components/supplier/form-styles";
import type { Category } from "@/lib/domain/types";

function descendantIds(cats: Category[], rootId: string): Set<string> {
  const out = new Set<string>();
  const stack = [rootId];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const c of cats) {
      if (c.parentId === cur && !out.has(c.id)) {
        out.add(c.id);
        stack.push(c.id);
      }
    }
  }
  return out;
}

export function AdminCategoryList({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editParent, setEditParent] = useState<string>("");
  const [msg, setMsg] = useState<string | null>(null);

  function startEdit(c: Category) {
    setEditId(c.id);
    setEditName(c.name);
    setEditParent(c.parentId ?? "");
    setMsg(null);
  }

  async function saveEdit(id: string) {
    setBusyId(id);
    setMsg(null);
    const parentId = editParent === "" ? null : editParent;
    const res = await fetch(`/api/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName.trim(),
        parentId,
      }),
      credentials: "same-origin",
    });
    const data = await res.json().catch(() => ({}));
    setBusyId(null);
    if (!res.ok) {
      setMsg(data.error ?? "Update failed");
      return;
    }
    setEditId(null);
    router.refresh();
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Delete category “${name}”?`)) return;
    setBusyId(id);
    setMsg(null);
    const res = await fetch(`/api/categories/${id}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    const data = await res.json().catch(() => ({}));
    setBusyId(null);
    if (!res.ok) {
      setMsg(data.error ?? "Delete failed");
      return;
    }
    if (editId === id) setEditId(null);
    router.refresh();
  }

  const parentOptions = (excludeId: string) => {
    const banned = descendantIds(categories, excludeId);
    banned.add(excludeId);
    return categories.filter((c) => !banned.has(c.id));
  };

  return (
    <div>
      {msg && (
        <p className="mb-4 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          {msg}
        </p>
      )}
      <ul className="divide-y divide-base-300 overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm ring-1 ring-base-300/20">
        {categories.map((c) => {
          const parent = c.parentId
            ? categories.find((x) => x.id === c.parentId)
            : null;
          const editing = editId === c.id;
          return (
            <li
              key={c.id}
              className="flex flex-col gap-4 px-4 py-4 text-sm sm:flex-row sm:items-start sm:justify-between sm:px-5"
            >
              {editing ? (
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className={supplierInputClass}
                  />
                  <select
                    value={editParent}
                    onChange={(e) => setEditParent(e.target.value)}
                    className={supplierSelectClass}
                  >
                    <option value="">Root (no parent)</option>
                    {parentOptions(c.id).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-base-content">{c.name}</span>
                  <p className="mt-1 font-mono text-xs text-base-content/45">
                    {parent ? `Under ${parent.name}` : "Root"} ·{" "}
                    {c.id.slice(0, 8)}…
                  </p>
                </div>
              )}
              <div className="flex shrink-0 flex-wrap gap-2">
                {editing ? (
                  <>
                    <button
                      type="button"
                      disabled={busyId === c.id}
                      onClick={() => saveEdit(c.id)}
                      className={supplierPrimaryButtonClass}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      disabled={busyId === c.id}
                      onClick={() => setEditId(null)}
                      className={`${supplierGhostButtonClass} border-error/20 text-error hover:border-error/30 hover:bg-error/5`}
                    >
                      <HiOutlineXMark className="h-4 w-4" />
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={busyId !== null}
                      onClick={() => startEdit(c)}
                      className={`${supplierGhostButtonClass} gap-1.5`}
                    >
                      <HiOutlinePencilSquare className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={busyId !== null}
                      onClick={() => remove(c.id, c.name)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-error/25 bg-error/5 px-4 py-2 text-sm font-medium text-error transition hover:bg-error/10"
                    >
                      <HiOutlineTrash className="h-4 w-4" />
                      Delete
                    </button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
