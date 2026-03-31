"use client";

import Link from "next/link";
import { HiOutlineCube } from "react-icons/hi2";
import { PaginatedClientList } from "@/components/paginated-client-list";
import { RichTextContent } from "@/components/rich-text-content";

export type AdminOrderLineItemVm = {
  key: string;
  productId: string;
  companyId: string;
  quantity: number;
  subtotal: number;
  productName: string;
  productDesc: string;
  productImageUrl: string | null;
  companyName: string;
};

export function AdminOrderLineItemsPaginated({
  items,
  resetKey,
}: {
  items: readonly AdminOrderLineItemVm[];
  resetKey: string;
}) {
  return (
    <PaginatedClientList
      items={items}
      pageSize={15}
      resetKey={resetKey}
      summaryClassName="px-5 py-3 text-sm text-base-content/55 sm:px-6"
      barClassName="mt-4 px-5 sm:px-6"
    >
      {(pageItems) => (
        <div className="overflow-x-auto">
          <table className="table w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-base-300 bg-base-200/30 text-left text-[11px] font-bold uppercase tracking-wider text-base-content/45">
                <th className="px-4 py-3 sm:px-6">Product</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3 text-center">Qty</th>
                <th className="px-4 py-3 text-end">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((row) => (
                <tr
                  key={row.key}
                  className="border-b border-base-200/80 transition hover:bg-base-200/25"
                >
                  <td className="max-w-[min(100vw,28rem)] px-4 py-3 sm:px-6">
                    <div className="flex items-start gap-3">
                      <div className="relative mt-0.5 h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-base-300 bg-base-200">
                        {row.productImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={row.productImageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-base-content/25">
                            <HiOutlineCube className="h-5 w-5" />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/products/${row.productId}`}
                          className="link link-hover font-semibold text-base-content no-underline decoration-primary/0 transition hover:text-primary"
                        >
                          {row.productName}
                        </Link>
                        {row.productDesc ? (
                          <RichTextContent
                            html={row.productDesc}
                            variant="baseMuted"
                            className="mt-1 line-clamp-2 max-w-md text-xs"
                          />
                        ) : null}
                        <p className="mt-1 font-mono text-[10px] text-base-content/40">
                          {row.productId.slice(0, 8)}…
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="max-w-[200px] px-4 py-3">
                    <Link
                      href={`/companies/${row.companyId}`}
                      className="link-hover link font-medium text-base-content/85 no-underline hover:text-primary"
                    >
                      {row.companyName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums font-semibold text-base-content">
                    {row.quantity}
                  </td>
                  <td className="px-4 py-3 text-end font-bold tabular-nums text-base-content">
                    {row.subtotal.toLocaleString()}{" "}
                    <span className="text-xs font-semibold text-base-content/45">
                      ETB
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PaginatedClientList>
  );
}
