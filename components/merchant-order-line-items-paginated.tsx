"use client";

import Link from "next/link";
import { PaginatedClientList } from "@/components/paginated-client-list";
import { RichTextContent } from "@/components/rich-text-content";

export type MerchantOrderLineItemVm = {
  key: string;
  productId: string;
  companyId: string;
  quantity: number;
  subtotal: number;
  title: string;
  desc: string;
};

export function MerchantOrderLineItemsPaginated({
  items,
  resetKey,
}: {
  items: readonly MerchantOrderLineItemVm[];
  resetKey: string;
}) {
  return (
    <PaginatedClientList
      items={items}
      pageSize={12}
      resetKey={resetKey}
      summaryClassName="px-5 py-3 text-sm text-muted-foreground sm:px-6"
      barClassName="mt-4 px-5 sm:px-6"
    >
      {(pageItems) => (
        <ul className="divide-y divide-border/50">
          {pageItems.map((row) => (
            <li key={row.key}>
              <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 transition hover:bg-muted/30 sm:px-6">
                <Link
                  href={`/products/${row.productId}`}
                  className="group min-w-0 max-w-xl flex-1"
                >
                  <span className="font-semibold text-foreground underline-offset-2 group-hover:text-primary group-hover:underline">
                    {row.title}
                  </span>
                  {row.desc ? (
                    <RichTextContent
                      html={row.desc}
                      variant="compact"
                      className="mt-1 line-clamp-3"
                    />
                  ) : null}
                </Link>
                <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                  × {row.quantity} — {row.subtotal.toLocaleString()} ETB
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PaginatedClientList>
  );
}
