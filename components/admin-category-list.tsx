"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  HiOutlineFunnel,
  HiOutlineMagnifyingGlass,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineXMark,
} from "react-icons/hi2";
import {
  supplierGhostButtonClass,
  supplierInputClass,
  supplierPrimaryButtonClass,
} from "@/components/supplier/form-styles";
import { ParentCategoryPicker } from "@/components/parent-category-picker";
import { PaginatedClientList } from "@/components/paginated-client-list";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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

function matchesListQuery(c: Category, q: string, all: Category[]): boolean {
  const low = q.trim().toLowerCase();
  if (!low) return true;
  if (c.name.toLowerCase().includes(low)) return true;
  if (c.id.toLowerCase().includes(low)) return true;
  const parent = c.parentId ? all.find((x) => x.id === c.parentId) : null;
  if (parent?.name.toLowerCase().includes(low)) return true;
  return false;
}

type ScopeFilter = "all" | "root" | "nested";

export function AdminCategoryList({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editParent, setEditParent] = useState<string>("");
  const [listQuery, setListQuery] = useState("");
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("all");
  const [msg, setMsg] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const filteredCategories = useMemo(() => {
    let rows = categories;
    if (scopeFilter === "root") rows = rows.filter((c) => !c.parentId);
    else if (scopeFilter === "nested") rows = rows.filter((c) => !!c.parentId);
    return rows.filter((c) => matchesListQuery(c, listQuery, categories));
  }, [categories, listQuery, scopeFilter]);

  const clearEditOnPaging = useCallback(() => {
    setEditId(null);
    setMsg(null);
  }, []);

  useEffect(() => {
    setEditId(null);
    setMsg(null);
  }, [listQuery, scopeFilter]);

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

  async function performDelete() {
    if (!pendingDelete) return;
    const { id } = pendingDelete;
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
    setPendingDelete(null);
    if (editId === id) setEditId(null);
    router.refresh();
  }

  const parentOptions = (excludeId: string) => {
    const banned = descendantIds(categories, excludeId);
    banned.add(excludeId);
    return categories.filter((c) => !banned.has(c.id));
  };

  return (
    <div className="space-y-4">
      {msg && (
        <p className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          {msg}
        </p>
      )}

      <div className="flex flex-col gap-4 rounded-2xl border border-base-300/80 bg-base-200/20 p-4 shadow-sm ring-1 ring-base-300/15 sm:p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-base-content">
              Find in tree
            </h3>
            <p className="text-xs text-base-content/50">
              Search by name, id, or parent name. Combine with a quick scope
              filter.
            </p>
          </div>
          <p className="text-sm text-base-content/55">
            Showing{" "}
            <span className="font-semibold text-base-content">
              {filteredCategories.length}
            </span>{" "}
            of {categories.length}
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="input input-bordered flex min-h-11 min-w-0 flex-1 items-center gap-2 border-base-300 bg-base-100 shadow-sm lg:max-w-xl">
            <HiOutlineMagnifyingGlass className="h-4 w-4 shrink-0 opacity-45" />
            <input
              type="search"
              className="grow bg-transparent text-sm outline-none placeholder:text-base-content/40"
              placeholder="Search categories…"
              value={listQuery}
              onChange={(e) => setListQuery(e.target.value)}
              autoComplete="off"
              aria-label="Search categories"
            />
            {listQuery ? (
              <button
                type="button"
                className="btn btn-ghost btn-xs btn-square shrink-0"
                aria-label="Clear search"
                onClick={() => setListQuery("")}
              >
                <HiOutlineXMark className="h-4 w-4" />
              </button>
            ) : null}
          </label>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-base-content/45">
              <HiOutlineFunnel className="h-3.5 w-3.5" />
              Scope
            </span>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["all", "All"],
                  ["root", "Root only"],
                  ["nested", "Subcategories"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`btn btn-xs rounded-full ${
                    scopeFilter === value
                      ? "btn-primary"
                      : "btn-ghost border border-base-300/80"
                  }`}
                  onClick={() => setScopeFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <PaginatedClientList
        items={filteredCategories}
        pageSize={15}
        resetKey={`${categories.map((c) => c.id).join(",")}|${listQuery}|${scopeFilter}`}
        summaryClassName="mb-3"
        summarySuffix="categories"
        barClassName="mt-4"
        onReset={clearEditOnPaging}
        onPageSelect={clearEditOnPaging}
      >
        {(pageItems) => (
          <ul className="divide-y divide-base-300 overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm ring-1 ring-base-300/20">
            {pageItems.length === 0 ? (
              <li className="px-4 py-14 text-center text-sm text-base-content/55 sm:px-5">
                {categories.length === 0 ? (
                  "No categories yet."
                ) : (
                  <>
                    No categories match your search or filters.{" "}
                    <button
                      type="button"
                      className="link link-primary font-medium"
                      onClick={() => {
                        setListQuery("");
                        setScopeFilter("all");
                      }}
                    >
                      Reset filters
                    </button>
                  </>
                )}
              </li>
            ) : null}
            {pageItems.map((c) => {
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
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
                          Name
                        </span>
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className={supplierInputClass}
                        />
                      </label>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
                          Parent
                        </span>
                        <ParentCategoryPicker
                          key={c.id}
                          options={parentOptions(c.id)}
                          value={editParent}
                          onChange={setEditParent}
                          rootOptionLabel="Root (no parent)"
                          compact
                        />
                      </div>
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
                          onClick={() =>
                            setPendingDelete({ id: c.id, name: c.name })
                          }
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
        )}
      </PaginatedClientList>
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title={
          pendingDelete
            ? `Delete category “${pendingDelete.name}”?`
            : "Delete category?"
        }
        description="Products still using this category may need to be recategorized. This cannot be undone."
        variant="danger"
        confirmLabel="Delete category"
        cancelLabel="Cancel"
        loading={pendingDelete !== null && busyId === pendingDelete.id}
        onConfirm={performDelete}
      />
    </div>
  );
}
