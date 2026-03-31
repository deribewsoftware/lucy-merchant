"use client";

import Link from "next/link";
import { PaginatedClientList } from "@/components/paginated-client-list";
import { RichTextContent } from "@/components/rich-text-content";

export type SupplierOrderLineItemVm = {
  key: string;
  productId: string;
  companyId: string;
  quantity: number;
  subtotal: number;
  title: string;
  desc: string;
  isYours: boolean;
};

export function SupplierOrderLineItemsPaginated({
  items,
  resetKey,
}: {
  items: readonly SupplierOrderLineItemVm[];
  resetKey: string;
}) {
  return (
    <PaginatedClientList
      items={items}
      pageSize={12}
      resetKey={resetKey}
      summaryClassName="px-5 py-3 text-sm text-base-content/55 sm:px-6"
      barClassName="mt-4 px-5 sm:px-6"
    >
      {(pageItems) => (
        <ul className="divide-y divide-base-200">
          {pageItems.map((row) => (
            <li
              key={row.key}
              className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 sm:px-6"
            >
              <div className="min-w-0 max-w-xl flex-1">
                <Link href={`/products/${row.productId}`} className="group block">
                  <span className="font-semibold text-base-content underline-offset-2 group-hover:text-primary group-hover:underline">
                    {row.title}
                  </span>
                  {row.desc ? (
                    <RichTextContent
                      html={row.desc}
                      variant="baseMuted"
                      className="mt-1 line-clamp-3"
                    />
                  ) : null}
                </Link>
                <p className="mt-2 text-sm tabular-nums text-base-content/65">
                  Qty {row.quantity}
                </p>
                {!row.isYours ? (
                  <p className="mt-1 text-xs text-warning">
                    Another supplier on this checkout — you only control status
                    for your catalog.
                  </p>
                ) : null}
              </div>
              <p className="shrink-0 font-semibold tabular-nums text-base-content">
                {row.subtotal.toLocaleString()} ETB
              </p>
            </li>
          ))}
        </ul>
      )}
    </PaginatedClientList>
  );
}
