import Link from "next/link";
import {
  HiOutlineClipboardDocumentList,
  HiOutlineMapPin,
} from "react-icons/hi2";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { getProduct } from "@/lib/db/catalog";
import { ordersForMerchant } from "@/lib/db/commerce";
import type { OrderStatus } from "@/lib/domain/types";
import { getSessionUser } from "@/lib/server/session";

type Props = {
  searchParams: Promise<{ page?: string }>;
};

function statusBadgeClass(status: OrderStatus): string {
  switch (status) {
    case "completed":
      return "badge-success";
    case "rejected":
      return "badge-error";
    case "delivered":
      return "badge-info";
    case "in_progress":
      return "badge-warning";
    case "accepted":
      return "badge-secondary";
    default:
      return "badge-ghost border border-base-300";
  }
}

export default async function MerchantOrdersPage({ searchParams }: Props) {
  const user = await getSessionUser();
  const all = user ? ordersForMerchant(user.id) : [];
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
    p > 1 ? `/merchant/orders?page=${p}` : "/merchant/orders";

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-2xl border border-base-300 bg-gradient-to-br from-base-100 via-primary/[0.04] to-secondary/[0.06] p-6 sm:p-7">
        <div
          className="pointer-events-none absolute bottom-0 right-0 h-24 w-36 text-primary/10"
          aria-hidden
        >
          <svg viewBox="0 0 140 80" fill="none" className="h-full w-full">
            <rect
              x="12"
              y="16"
              width="116"
              height="48"
              rx="8"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <path
              d="M28 36h24M28 48h56"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="relative flex flex-wrap items-start gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <HiOutlineClipboardDocumentList className="h-6 w-6" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-base-content">
              Orders
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-base-content/65">
              Status flow: pending → accepted → in progress → delivered →
              completed (or rejected). Open an order for chat, payment status,
              and reviews after completion.
            </p>
          </div>
        </div>
      </header>

      <ul className="space-y-4">
        {orders.length === 0 && (
          <li className="rounded-2xl border border-dashed border-base-300 bg-base-100/60 px-6 py-10 text-center text-sm text-base-content/60">
            No orders yet — build a cart and check out from the catalog.
          </li>
        )}
        {orders.map((o) => (
          <li
            key={o.id}
            className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm ring-1 ring-base-300/15 transition hover:ring-primary/15"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                href={`/merchant/orders/${o.id}`}
                className="font-mono text-xs text-primary hover:underline"
              >
                {o.id}
              </Link>
              <span
                className={`badge badge-sm capitalize ${statusBadgeClass(o.status)}`}
              >
                {o.status.replace("_", " ")}
              </span>
            </div>
            <Link
              href={`/merchant/orders/${o.id}`}
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-base-content hover:text-primary"
            >
              Open order — chat &amp; reviews
              <span aria-hidden className="text-primary">
                →
              </span>
            </Link>
            <p className="mt-3 flex items-start gap-2 text-sm text-base-content/65">
              <HiOutlineMapPin className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
              <span>{o.deliveryLocation}</span>
            </p>
            <p className="mt-2 text-sm font-semibold text-base-content">
              {o.totalPrice.toLocaleString()} ETB
              <span className="mx-2 font-normal text-base-content/40">·</span>
              commission {o.commissionAmount.toLocaleString()} ETB
              <span className="mx-2 font-normal text-base-content/40">·</span>
              payment: {o.paymentStatus}
            </p>
            <ul className="mt-4 space-y-1.5 border-t border-base-300 pt-4 text-sm text-base-content/70">
              {o.items.map((i) => {
                const p = getProduct(i.productId);
                return (
                  <li key={i.productId}>
                    <Link
                      href={`/products/${i.productId}`}
                      className="link link-hover font-medium text-primary no-underline"
                    >
                      {p?.name ?? i.productId}
                    </Link>{" "}
                    × {i.quantity}
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
