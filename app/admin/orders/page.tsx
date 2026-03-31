import Link from "next/link";
import {
  HiOutlineArrowPath,
  HiOutlineClipboardDocumentList,
  HiOutlineShieldCheck,
  HiOutlineUserGroup,
} from "react-icons/hi2";
import { PaginationBar, PaginationSummary } from "@/components/ui/pagination-bar";
import { listOrders } from "@/lib/db/commerce";
import { findUserById } from "@/lib/db/users";
import {
  adminOrderMatchesTab,
  adminOrderTab,
  orderStatusBadgeClass,
  orderStatusLabel,
  type AdminOrdersTab,
} from "@/lib/domain/order-presentations";
import { isDualPlatformCommissionSettled } from "@/lib/domain/platform-commission";
import { requireStaffOrdersPageAccess } from "@/lib/server/require-staff-page";

type Props = {
  searchParams: Promise<{ page?: string; tab?: string }>;
};

const TABS: {
  id: AdminOrdersTab;
  label: string;
  hint: string;
  icon: typeof HiOutlineClipboardDocumentList;
}[] = [
  {
    id: "all",
    label: "All",
    hint: "Full marketplace log",
    icon: HiOutlineClipboardDocumentList,
  },
  {
    id: "needs_platform",
    label: "Platform",
    hint: "Payment, bank proof, or post-delivery supplier payout",
    icon: HiOutlineShieldCheck,
  },
  {
    id: "fulfillment",
    label: "Fulfillment",
    hint: "Supplier / buyer pipeline",
    icon: HiOutlineArrowPath,
  },
  {
    id: "done",
    label: "Closed",
    hint: "Completed or rejected",
    icon: HiOutlineUserGroup,
  },
];

function parseTab(raw: string | undefined): AdminOrdersTab {
  if (
    raw === "needs_platform" ||
    raw === "fulfillment" ||
    raw === "done" ||
    raw === "all"
  ) {
    return raw;
  }
  return "all";
}

export default async function AdminOrdersPage({ searchParams }: Props) {
  await requireStaffOrdersPageAccess();

  const sp = await searchParams;
  const tab = parseTab(sp.tab);
  const pageRaw = parseInt(sp.page ?? "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;
  const pageSize = 20;

  const all = [...listOrders()].sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1,
  );
  const filtered =
    tab === "all" ? all : all.filter((o) => adminOrderMatchesTab(o, tab));

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const orders = filtered.slice(start, start + pageSize);

  const ordersHref = (p: number) => {
    const q = new URLSearchParams();
    if (tab !== "all") q.set("tab", tab);
    if (p > 1) q.set("page", String(p));
    const qs = q.toString();
    return qs ? `/admin/orders?${qs}` : "/admin/orders";
  };

  const tabHref = (t: AdminOrdersTab) => {
    const q = new URLSearchParams();
    if (t !== "all") q.set("tab", t);
    const qs = q.toString();
    return qs ? `/admin/orders?${qs}` : "/admin/orders";
  };

  const counts = {
    all: all.length,
    needs_platform: all.filter((o) => adminOrderTab(o) === "needs_platform")
      .length,
    fulfillment: all.filter((o) => adminOrderTab(o) === "fulfillment").length,
    done: all.filter((o) => adminOrderTab(o) === "done").length,
  };

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
              Marketplace order log — payments, bank review, supplier payout
              after delivery, line items, and chat.
            </p>
            {total > 0 && (
              <PaginationSummary
                page={safePage}
                pageSize={pageSize}
                total={total}
                suffix={tab !== "all" ? "in this filter" : undefined}
                className="mt-2 text-sm text-base-content/60 [&_span]:text-base-content"
              />
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-base-content/45">
          Filter
        </p>
        <div className="flex flex-wrap gap-2">
          {TABS.map(({ id, label, hint, icon: Icon }) => {
            const active = tab === id;
            const count = counts[id];
            return (
              <Link
                key={id}
                href={tabHref(id)}
                title={hint}
                className={`group inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-base-300 bg-base-100 text-base-content/75 hover:border-primary/30 hover:bg-base-200/50"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-80" />
                <span>{label}</span>
                <span
                  className={`rounded-lg px-1.5 py-0.5 text-xs tabular-nums ${
                    active
                      ? "bg-primary/15 text-primary"
                      : "bg-base-200 text-base-content/55"
                  }`}
                >
                  {count}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm ring-1 ring-base-300/20">
        <div className="overflow-x-auto">
          <table className="table table-sm w-full min-w-[720px]">
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
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`badge badge-sm font-semibold capitalize ${orderStatusBadgeClass(o.status)}`}
                        >
                          {orderStatusLabel(o.status)}
                        </span>
                        {o.status === "delivered" &&
                        (o.commissionAmount > 0 ||
                          (o.supplierCommissionAmount ?? 0) > 0) &&
                        !isDualPlatformCommissionSettled(o) ? (
                          <span className="badge badge-warning badge-sm font-medium">
                            Fees pending
                          </span>
                        ) : null}
                        {o.status === "delivered" &&
                        (o.commissionAmount > 0 ||
                          (o.supplierCommissionAmount ?? 0) > 0) &&
                        isDualPlatformCommissionSettled(o) ? (
                          <span className="badge badge-success badge-sm font-medium">
                            Fees OK
                          </span>
                        ) : null}
                        {o.merchantDisputeOpenedAt ? (
                          <span className="badge badge-warning badge-sm font-medium">
                            Dispute
                          </span>
                        ) : null}
                      </div>
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
            {all.length === 0
              ? "No orders yet."
              : "No orders in this view."}
            {tab !== "all" && all.length > 0 ? (
              <Link
                href="/admin/orders"
                className="btn btn-link btn-sm mt-2 block text-primary"
              >
                Show all orders
              </Link>
            ) : null}
          </p>
        )}
      </div>

      <PaginationBar
        page={safePage}
        pageSize={pageSize}
        total={total}
        buildHref={ordersHref}
      />
    </div>
  );
}
