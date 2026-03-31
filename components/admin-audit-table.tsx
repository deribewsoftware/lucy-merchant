"use client";

import { useCallback, useEffect, useState } from "react";
import { HiChevronDown, HiChevronRight } from "react-icons/hi2";
import { PaginationBar, PaginationSummary } from "@/components/ui/pagination-bar";
import { auditActionLabel } from "@/lib/admin-audit-action-labels";
import { totalPagesFor } from "@/lib/utils/pagination";

type Entry = {
  id: string;
  actorId: string;
  actorEmail: string;
  actorName: string;
  action: string;
  resource?: string;
  detail?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: string;
};

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

export function AdminAuditTable() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(50);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 320);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const offset = Math.max(0, (page - 1) * pageSize);
    const params = new URLSearchParams({
      offset: String(offset),
      limit: String(pageSize),
    });
    if (search) params.set("q", search);
    const res = await fetch(`/api/admin/audit-logs?${params}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLoading(false);
      setError(data.error ?? "Could not load audit log");
      return;
    }
    const nextTotal = data.total ?? 0;
    setTotal(nextTotal);
    const tp = totalPagesFor(nextTotal, pageSize);
    if (nextTotal > 0 && page > tp) {
      setPage(tp);
      return;
    }
    setLoading(false);
    setEntries(data.entries ?? []);
  }, [page, pageSize, search]);

  useEffect(() => {
    void load();
  }, [load]);

  function toggleExpand(id: string) {
    setExpandedId((cur) => (cur === id ? null : id));
  }

  const safePage =
    total > 0 ? Math.min(page, totalPagesFor(total, pageSize)) : 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <p className="text-sm text-base-content/70">
          Who signed in and what staff changed (newest first). Entries are kept up
          to a rolling limit on the server.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <label className="form-control w-full min-w-[200px] max-w-xs sm:w-auto">
            <span className="label py-0 pb-1">
              <span className="label-text text-xs text-base-content/60">
                Search
              </span>
            </span>
            <input
              type="search"
              className="input input-bordered input-sm w-full"
              placeholder="Action, email, resource, IP…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              autoComplete="off"
            />
          </label>
          <label className="form-control w-full min-w-[120px] max-w-[140px] sm:w-auto">
            <span className="label py-0 pb-1">
              <span className="label-text text-xs text-base-content/60">
                Per page
              </span>
            </span>
            <select
              className="select select-bordered select-sm w-full"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value) as (typeof PAGE_SIZE_OPTIONS)[number]);
                setPage(1);
              }}
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      ) : null}

      {total > 0 && !error ? (
        <PaginationSummary
          page={safePage}
          pageSize={pageSize}
          total={total}
          className="text-base-content/60"
          suffix="entries"
        />
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-base-300/80">
        <table className="table table-zebra table-sm">
          <thead>
            <tr>
              <th className="w-10" aria-label="Details" />
              <th>When (UTC)</th>
              <th>Who</th>
              <th>Action</th>
              <th>Resource</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center text-sm opacity-60">
                  Loading…
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-sm opacity-60">
                  {search
                    ? "No entries match your search."
                    : "No entries yet."}
                </td>
              </tr>
            ) : (
              entries.flatMap((e) => {
                const open = expandedId === e.id;
                const hasExtra =
                  (e.detail && Object.keys(e.detail).length > 0) || e.userAgent;
                const mainRow = (
                  <tr key={e.id}>
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs px-1"
                        onClick={() => toggleExpand(e.id)}
                        disabled={!hasExtra}
                        aria-expanded={open}
                        aria-label={open ? "Hide details" : "Show details"}
                      >
                        {hasExtra ? (
                          open ? (
                            <HiChevronDown className="h-4 w-4" />
                          ) : (
                            <HiChevronRight className="h-4 w-4" />
                          )
                        ) : (
                          <span className="inline-block w-4 opacity-30">·</span>
                        )}
                      </button>
                    </td>
                    <td className="whitespace-nowrap font-mono text-xs">
                      {e.createdAt}
                    </td>
                    <td>
                      <div className="text-sm font-medium">{e.actorName}</div>
                      <div className="text-xs opacity-70">{e.actorEmail}</div>
                    </td>
                    <td className="max-w-[min(260px,40vw)] text-xs">
                      <span
                        className="font-medium leading-snug text-base-content/90"
                        title={e.action}
                      >
                        {auditActionLabel(e.action)}
                      </span>
                      <span className="mt-0.5 block truncate font-mono text-[10px] text-base-content/45">
                        {e.action}
                      </span>
                    </td>
                    <td className="max-w-[200px] truncate font-mono text-xs">
                      {e.resource ?? "—"}
                    </td>
                    <td className="font-mono text-xs">{e.ip ?? "—"}</td>
                  </tr>
                );
                if (!open || !hasExtra) {
                  return [mainRow];
                }
                const detailRow = (
                  <tr key={`${e.id}-detail`} className="bg-base-200/50">
                    <td colSpan={6} className="border-t border-base-300/60">
                      <div className="space-y-2 px-2 py-3 text-xs">
                        {e.userAgent ? (
                          <div>
                            <span className="font-semibold text-base-content/80">
                              User-Agent
                            </span>
                            <p className="mt-1 break-all font-mono opacity-90">
                              {e.userAgent}
                            </p>
                          </div>
                        ) : null}
                        {e.detail && Object.keys(e.detail).length > 0 ? (
                          <div>
                            <span className="font-semibold text-base-content/80">
                              Detail
                            </span>
                            <pre className="mt-1 max-h-48 overflow-auto rounded-lg bg-base-300/40 p-3 font-mono text-[11px] leading-relaxed">
                              {JSON.stringify(e.detail, null, 2)}
                            </pre>
                          </div>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
                return [mainRow, detailRow];
              })
            )}
          </tbody>
        </table>
      </div>

      <PaginationBar
        page={safePage}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        className="justify-between sm:justify-center"
      />
    </div>
  );
}
