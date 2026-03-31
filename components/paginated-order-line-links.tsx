"use client";

import Link from "next/link";
import { PaginatedClientList } from "@/components/paginated-client-list";

export type OrderLineLinkVm = {
  key: string;
  productId: string;
  title: string;
  quantity: number;
};

export function PaginatedOrderLineLinks({ lines }: { lines: OrderLineLinkVm[] }) {
  return (
    <PaginatedClientList
      items={lines}
      pageSize={8}
      resetKey={lines.map((l) => l.key).join(",")}
      summaryClassName="text-[11px] text-base-content/50"
      summarySuffix="lines"
      barClassName="mt-3"
    >
      {(pageItems) => (
        <ul className="mt-2 space-y-1.5 text-sm">
          {pageItems.map((i) => (
            <li key={i.key}>
              <Link
                href={`/products/${i.productId}`}
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                {i.title}
              </Link>
              <span className="text-base-content/65"> × {i.quantity}</span>
            </li>
          ))}
        </ul>
      )}
    </PaginatedClientList>
  );
}
