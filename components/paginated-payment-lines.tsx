"use client";

import { PaginatedClientList } from "@/components/paginated-client-list";
import type { Payment } from "@/lib/domain/types";

type Props = {
  payments: Payment[];
  paymentLiClass: string;
  listBorderClass: string;
};

export function PaginatedPaymentLines({
  payments,
  paymentLiClass,
  listBorderClass,
}: Props) {
  return (
    <PaginatedClientList
      items={payments}
      pageSize={8}
      resetKey={payments.map((p) => p.id).join(",")}
      summaryClassName="mb-2"
      summarySuffix="payments"
      barClassName="mt-2"
    >
      {(pageItems) => (
        <ul className={`mt-3 space-y-2 border-t pt-3 text-xs ${listBorderClass}`}>
          {pageItems.map((p) => (
            <li key={p.id} className={paymentLiClass}>
              <span className="font-mono text-[11px] opacity-80">
                {p.id.slice(0, 8)}…
              </span>
              <span>
                {p.amount.toLocaleString()} ETB · {p.status}
                {p.transactionRef ? ` · ref ${p.transactionRef}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </PaginatedClientList>
  );
}
