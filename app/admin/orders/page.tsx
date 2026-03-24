import Link from "next/link";
import { HiOutlineClipboardDocumentList } from "react-icons/hi2";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { listOrders } from "@/lib/db/commerce";
import { findUserById } from "@/lib/db/users";

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default async function AdminOrdersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const pageRaw = parseInt(sp.page ?? "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;
  const pageSize = 20;

  const all = [...listOrders()].sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1,
  );
  const total = all.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const orders = all.slice(start, start + pageSize);

  const ordersHref = (p: number) =>
    p > 1 ? `/admin/orders?page=${p}` : "/admin/orders";

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 border-b border-base-300 pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <HiOutlineClipboardDocumentList className="h-7 w-7" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-base-content">
              Orders
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-base-content/60">
              Full marketplace order log — open a row for payment status, line
              items, and supplier coordination.
            </p>
            {total > 0 && (
              <p className="mt-2 text-sm text-base-content/50">
                Showing {start + 1}–{Math.min(start + pageSize, total)} of {total}
              </p>
            )}
          </div>
        </div>
      </header>

      <div className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm ring-1 ring-base-300/20">
        <div className="overflow-x-auto">
          <table className="table table-sm w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-base-300 bg-base-200/50 text-left text-xs font-semibold uppercase tracking-wide text-base-content/50">
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Merchant</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3 text-end">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const merchant = findUserById(o.merchantId);
                return (
                  <tr
                    key={o.id}
                    className="border-b border-base-300/60 text-sm transition hover:bg-base-200/40"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-base-content/55">
                      {new Date(o.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-mono text-xs font-semibold text-primary hover:underline"
                      >
                        {o.id.slice(0, 8)}…
                      </Link>
                    </td>
                    <td className="max-w-[12rem] truncate px-4 py-3 text-base-content">
                      {merchant?.name ?? o.merchantId}
                    </td>
                    <td className="px-4 py-3 capitalize text-base-content">
                      {o.status.replace("_", " ")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          o.paymentStatus === "paid"
                            ? "font-medium text-success"
                            : o.paymentStatus === "failed"
                              ? "font-medium text-error"
                              : "font-medium text-warning"
                        }
                      >
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-end font-semibold tabular-nums text-base-content">
                      {o.totalPrice.toLocaleString()} ETB
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {orders.length === 0 && total === 0 && (
          <p className="p-12 text-center text-sm text-base-content/55">
            No orders yet.
          </p>
        )}
      </div>

      <PaginationBar
        page={safePage}
        pageSize={pageSize}
        total={total}
        buildHref={ordersHref}
        variant="admin"
      />
    </div>
  );
}
