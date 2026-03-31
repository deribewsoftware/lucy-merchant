"use client";

import Link from "next/link";
import { PaginatedClientList } from "@/components/paginated-client-list";

export type OrderSupplierRow = { id: string; name: string };

export function PaginatedOrderSuppliersList({ rows }: { rows: OrderSupplierRow[] }) {
  if (rows.length === 0) return null;

  return (
    <PaginatedClientList
      items={rows}
      pageSize={6}
      resetKey={rows.map((r) => r.id).join(",")}
      summaryClassName="mb-2 text-xs text-base-content/55"
      summarySuffix="suppliers"
      barClassName="mt-3"
    >
      {(pageItems) => (
        <ul className="mt-3 space-y-2">
          {pageItems.map((r) => (
            <li key={r.id}>
              <Link
                href={`/companies/${r.id}`}
                className="flex items-center justify-between gap-2 rounded-xl border border-base-300/60 bg-base-200/20 px-3 py-2.5 text-sm font-medium transition hover:border-primary/30 hover:bg-primary/5"
              >
                <span className="truncate">{r.name}</span>
                <span className="shrink-0 text-xs text-primary">View</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PaginatedClientList>
  );
}
