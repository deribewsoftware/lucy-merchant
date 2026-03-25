import Link from "next/link";
import {
  HiOutlineArrowPath,
  HiOutlineClipboardDocumentList,
  HiOutlineInboxStack,
  HiOutlineUserGroup,
} from "react-icons/hi2";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { SupplierHeroBackdrop } from "@/components/supplier/supplier-portal-graphics";
import { SupplierOrderActions } from "@/components/supplier-order-actions";
import { companiesByOwner, getProduct } from "@/lib/db/catalog";
import { ordersForSupplierCompanyIds } from "@/lib/db/commerce";
import { findUserById } from "@/lib/db/users";
import {
  orderStatusBadgeClass,
  orderStatusLabel,
  supplierOrderMatchesTab,
  supplierOrderTab,
  type SupplierOrdersTab,
} from "@/lib/domain/order-presentations";
import {
  isPlatformCommissionPaid,
  isSupplierPlatformCommissionPaid,
} from "@/lib/domain/platform-commission";
import {
  SUPPLIER_ORDERS_HOLD_EXPLAINER_BODY,
  SUPPLIER_ORDERS_HOLD_EXPLAINER_TITLE,
} from "@/lib/domain/commission-hold-copy";
import { getSessionUser } from "@/lib/server/session";

type Props = {
  searchParams: Promise<{ page?: string; tab?: string; hold?: string }>;
};

const TABS: { id: SupplierOrdersTab; label: string; hint: string; icon: typeof HiOutlineInboxStack }[] =
  [
    {
      id: "all",
      label: "All",
      hint: "Every order tied to your companies",
      icon: HiOutlineClipboardDocumentList,
    },
    {
      id: "needs_you",
      label: "Needs you",
      hint: "Accept, progress, or deliver",
      icon: HiOutlineArrowPath,
    },
    {
      id: "in_flight",
      label: "In flight",
      hint: "Delivered — commission to platform and/or buyer completion",
      icon: HiOutlineInboxStack,
    },
    {
      id: "done",
      label: "Done",
      hint: "Completed or rejected",
      icon: HiOutlineUserGroup,
    },
  ];

function parseTab(raw: string | undefined): SupplierOrdersTab {
  if (
    raw === "needs_you" ||
    raw === "in_flight" ||
    raw === "done" ||
    raw === "all"
  ) {
    return raw;
  }
  return "all";
}

export default async function SupplierOrdersPage({ searchParams }: Props) {
  const user = await getSessionUser();
  const mine = user ? companiesByOwner(user.id).map((c) => c.id) : [];
  const all = ordersForSupplierCompanyIds(mine);
  const sp = await searchParams;
  const showCommissionHold = sp.hold === "commission";
  const tab = parseTab(sp.tab);
  const filtered =
    tab === "all" ? all : all.filter((o) => supplierOrderMatchesTab(o, tab));

  const pageRaw = parseInt(sp.page ?? "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;
  const pageSize = 12;
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const orders = filtered.slice(start, start + pageSize);

  const href = (p: number) => {
    const base = "/supplier/orders";
    const q = new URLSearchParams();
    if (tab !== "all") q.set("tab", tab);
    if (p > 1) q.set("page", String(p));
    const qs = q.toString();
    return qs ? `${base}?${qs}` : base;
  };

  const tabHref = (t: SupplierOrdersTab) => {
    const q = new URLSearchParams();
    if (t !== "all") q.set("tab", t);
    const qs = q.toString();
    return qs ? `/supplier/orders?${qs}` : "/supplier/orders";
  };

  const counts = {
    all: all.length,
    needs_you: all.filter((o) => supplierOrderTab(o) === "needs_you")
      .length,
    in_flight: all.filter((o) => supplierOrderTab(o) === "in_flight")
      .length,
    done: all.filter((o) => supplierOrderTab(o) === "done").length,
  };

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-2xl border border-base-300 bg-gradient-to-br from-base-100 via-base-200/40 to-primary/[0.05] p-6 shadow-sm ring-1 ring-base-300/25 sm:p-8">
        <SupplierHeroBackdrop />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <HiOutlineClipboardDocumentList className="h-7 w-7" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-base-content sm:text-3xl">
                Orders
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-base-content/70">
                Paid orders that include your products. Use{" "}
                <strong className="font-semibold text-base-content/85">
                  Needs you
                </strong>{" "}
                for anything waiting on your action.
              </p>
            </div>
          </div>
        </div>
      </header>

      {showCommissionHold ? (
        <div
          role="status"
          className="rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-base-content shadow-sm"
        >
          <p className="font-semibold">{SUPPLIER_ORDERS_HOLD_EXPLAINER_TITLE}</p>
          <p className="mt-1 text-base-content/80">{SUPPLIER_ORDERS_HOLD_EXPLAINER_BODY}</p>
        </div>
      ) : null}

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

      <ul className="space-y-4">
        {orders.length === 0 && (
          <li className="rounded-2xl border border-dashed border-base-300 bg-base-200/20 px-6 py-12 text-center">
            <p className="text-sm font-medium text-base-content/70">
              {total === 0 && tab === "all"
                ? "No orders yet."
                : "No orders in this view."}
            </p>
            {tab !== "all" && total === 0 && all.length > 0 ? (
              <Link
                href="/supplier/orders"
                className="btn btn-link btn-sm mt-2 text-primary"
              >
                Show all orders
              </Link>
            ) : null}
          </li>
        )}
        {orders.map((o) => {
          const merchant = findUserById(o.merchantId);
          const bucket = supplierOrderTab(o);
          return (
            <li
              key={o.id}
              className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm ring-1 ring-base-300/15 transition hover:ring-primary/20"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`badge badge-sm font-semibold capitalize ${orderStatusBadgeClass(o.status)}`}
                    >
                      {orderStatusLabel(o.status)}
                    </span>
                    {bucket === "needs_you" ? (
                      <span className="badge badge-warning badge-sm badge-outline">
                        Action needed
                      </span>
                    ) : null}
                  </div>
                  <div>
                    <Link
                      href={`/supplier/orders/${o.id}`}
                      className="font-display text-lg font-bold text-base-content hover:text-primary"
                    >
                      Order{" "}
                      <span className="font-mono text-base text-primary">
                        {o.id.slice(0, 8).toUpperCase()}
                      </span>
                    </Link>
                    <p className="mt-1 text-xs font-mono text-base-content/40">
                      {o.id}
                    </p>
                  </div>
                  <p className="text-sm text-base-content/65">
                    Buyer:{" "}
                    <span className="font-medium text-base-content">
                      {merchant?.name ?? "Merchant"}
                    </span>
                  </p>
                  <p className="text-sm text-base-content/70 line-clamp-2">
                    {o.deliveryLocation || "—"}
                  </p>
                  <p className="text-base font-semibold tabular-nums text-base-content">
                    {o.totalPrice.toLocaleString()} ETB
                  </p>
                  {(o.supplierCommissionAmount ?? 0) > 0 ? (
                    <p className="text-sm text-violet-700 dark:text-violet-300">
                      Supplier platform fee:{" "}
                      <span className="font-semibold tabular-nums">
                        {(o.supplierCommissionAmount ?? 0).toLocaleString()} ETB
                      </span>
                      {isSupplierPlatformCommissionPaid(o) ? (
                        <span className="ml-1.5 text-xs font-medium text-success">
                          · Paid
                        </span>
                      ) : (
                        <span className="ml-1.5 text-xs font-medium text-warning">
                          · Pending
                        </span>
                      )}
                    </p>
                  ) : (
                    <p className="text-xs text-base-content/50">
                      No supplier platform fee on this order
                    </p>
                  )}
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-base-content/45">
                      Products
                    </p>
                    <ul className="mt-2 space-y-1.5 text-sm">
                      {o.items.map((i) => {
                        const p = getProduct(i.productId);
                        const title = p?.name ?? i.productId;
                        return (
                          <li key={`${i.productId}-${i.companyId}`}>
                            <Link
                              href={`/products/${i.productId}`}
                              className="font-medium text-primary underline-offset-2 hover:underline"
                            >
                              {title}
                            </Link>
                            <span className="text-base-content/65">
                              {" "}
                              × {i.quantity}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  <p>
                    <Link
                      href={`/supplier/orders/${o.id}`}
                      className="btn btn-outline btn-primary btn-sm border-primary/30"
                    >
                      Open detail & chat
                    </Link>
                  </p>
                </div>
                <div className="shrink-0 border-t border-base-300 pt-4 lg:w-80 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-base-content/45">
                    Next step
                  </p>
                  <SupplierOrderActions
                    orderId={o.id}
                    order={{
                      status: o.status,
                      paymentMethod: o.paymentMethod,
                      paymentStatus: o.paymentStatus,
                    }}
                    platformCommissionPaid={isPlatformCommissionPaid(o)}
                    supplierCommissionPaid={isSupplierPlatformCommissionPaid(o)}
                    supplierCommissionOwed={
                      Math.round((o.supplierCommissionAmount ?? 0) * 100) / 100
                    }
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <PaginationBar
        page={safePage}
        pageSize={pageSize}
        total={total}
        buildHref={href}
      />
    </div>
  );
}
