import Link from "next/link";
import { HiOutlineClipboardDocumentList } from "react-icons/hi2";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { SupplierHeroBackdrop } from "@/components/supplier/supplier-portal-graphics";
import { SupplierOrderActions } from "@/components/supplier-order-actions";
import { companiesByOwner, getProduct } from "@/lib/db/catalog";
import { ordersForSupplierCompanyIds } from "@/lib/db/commerce";
import { getSessionUser } from "@/lib/server/session";

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default async function SupplierOrdersPage({ searchParams }: Props) {
  const user = await getSessionUser();
  const mine = user ? companiesByOwner(user.id).map((c) => c.id) : [];
  const all = ordersForSupplierCompanyIds(mine);
  const sp = await searchParams;
  const pageRaw = parseInt(sp.page ?? "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;
  const pageSize = 12;
  const total = all.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const orders = all.slice(start, start + pageSize);

  const href = (p: number) =>
    p > 1 ? `/supplier/orders?page=${p}` : "/supplier/orders";

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-2xl border border-base-300 bg-gradient-to-br from-base-100 via-base-200/40 to-primary/[0.05] p-6 shadow-sm ring-1 ring-base-300/25 sm:p-8">
        <SupplierHeroBackdrop />
        <div className="relative flex gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <HiOutlineClipboardDocumentList className="h-7 w-7" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-base-content sm:text-3xl">
              Orders
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-base-content/70">
              Orders containing products from your companies. Update fulfillment
              status for your buyers.
            </p>
          </div>
        </div>
      </header>

      <ul className="space-y-4">
        {orders.length === 0 && (
          <li className="rounded-2xl border border-dashed border-base-300 bg-base-200/20 px-6 py-10 text-center text-sm text-base-content/60">
            No orders yet.
          </li>
        )}
        {orders.map((o) => (
          <li
            key={o.id}
            className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm ring-1 ring-base-300/15"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link
                href={`/supplier/orders/${o.id}`}
                className="link link-hover font-mono text-xs text-base-content/50"
              >
                {o.id}
              </Link>
              <SupplierOrderActions orderId={o.id} current={o.status} />
            </div>
            <p className="mt-2">
              <Link
                href={`/supplier/orders/${o.id}`}
                className="link link-primary text-sm font-medium no-underline hover:underline"
              >
                Open order — chat with buyer
              </Link>
            </p>
            <p className="mt-2 text-sm text-base-content/70">{o.deliveryLocation}</p>
            <p className="mt-1 text-sm font-semibold text-base-content">
              {o.totalPrice.toLocaleString()} ETB
            </p>
            <ul className="mt-2 space-y-1 text-sm text-base-content/65">
              {o.items.map((i) => {
                const p = getProduct(i.productId);
                return (
                  <li key={i.productId}>
                    {p?.name ?? i.productId} × {i.quantity}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>

      <PaginationBar
        page={safePage}
        pageSize={pageSize}
        total={total}
        buildHref={href}
        variant="admin"
      />
    </div>
  );
}
