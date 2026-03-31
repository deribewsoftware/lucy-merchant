"use client";

import Link from "next/link";
import { Package, TrendingUp } from "lucide-react";
import { PaginatedClientList } from "@/components/paginated-client-list";
import type { OrderStatus } from "@/lib/domain/types";

export function PaginatedSupplierTopProducts({
  items,
}: {
  items: {
    rank: number;
    productId: string;
    name: string;
    revenueEtb: number;
    unitsSold: number;
  }[];
}) {
  return (
    <PaginatedClientList
      items={items}
      pageSize={8}
      resetKey={items.map((p) => p.productId).join(",")}
      summaryClassName="mb-3 text-sm text-muted-foreground"
      summarySuffix="SKUs"
      barClassName="mt-4"
    >
      {(pageItems) => (
        <ul className="divide-y divide-border/50">
          {pageItems.map((p) => (
            <li
              key={p.productId}
              className="group flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-primary/5"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 text-xs font-bold text-muted-foreground">
                  #{p.rank}
                </span>
                <Link
                  href={`/products/${p.productId}`}
                  className="font-medium text-foreground transition-colors group-hover:text-primary"
                >
                  {p.name}
                </Link>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="font-semibold text-foreground">
                  {p.revenueEtb.toLocaleString()} ETB
                </span>
                <span className="rounded-full bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                  {p.unitsSold} units
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PaginatedClientList>
  );
}

export function PaginatedMerchantTopLines({
  items,
}: {
  items: {
    rank: number;
    productId: string;
    name: string;
    spendEtb: number;
    units: number;
  }[];
}) {
  return (
    <PaginatedClientList
      items={items}
      pageSize={8}
      resetKey={items.map((l) => l.productId).join(",")}
      summaryClassName="mb-3 text-sm text-muted-foreground"
      summarySuffix="products"
      barClassName="mt-4"
    >
      {(pageItems) => (
        <div className="divide-y divide-border">
          {pageItems.map((line) => (
            <Link
              key={line.productId}
              href={`/products/${line.productId}`}
              className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-muted-foreground">
                  {line.rank}
                </span>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">{line.name}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground">
                  {line.spendEtb.toLocaleString()} ETB
                </p>
                <p className="text-sm text-muted-foreground">{line.units} units</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PaginatedClientList>
  );
}

type RecentOrderVm = {
  id: string;
  status: OrderStatus;
  totalPrice: number;
  deliveryLocation: string;
  disputeFiled?: boolean;
  disputeAvailable?: boolean;
};

function statusLabel(status: OrderStatus): string {
  return status.replace(/_/g, " ");
}

export function PaginatedMerchantRecentOrders({ orders }: { orders: RecentOrderVm[] }) {
  return (
    <PaginatedClientList
      items={orders}
      pageSize={6}
      resetKey={orders.map((o) => o.id).join(",")}
      summaryClassName="mb-3 text-sm text-muted-foreground"
      summarySuffix="orders"
      barClassName="mt-6"
    >
      {(pageItems) => (
        <div className="grid gap-4 sm:grid-cols-2">
          {pageItems.map((o) => (
            <Link
              key={o.id}
              href={`/merchant/orders/${o.id}`}
              className="lm-card lm-card-interactive"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-xs text-muted-foreground">
                  {o.id.slice(0, 12)}...
                </span>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                  {o.disputeFiled ? (
                    <span className="rounded-full border border-amber-500/35 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
                      Dispute
                    </span>
                  ) : null}
                  {o.disputeAvailable ? (
                    <span className="rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive">
                      Late
                    </span>
                  ) : null}
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                      o.status === "completed"
                        ? "bg-success/15 text-success"
                        : o.status === "rejected"
                          ? "bg-destructive/15 text-destructive"
                          : o.status === "delivered"
                            ? "bg-info/15 text-info"
                            : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {statusLabel(o.status)}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-xl font-bold text-primary">
                {o.totalPrice.toLocaleString()} ETB
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {o.deliveryLocation}
              </p>
              <div className="mt-3 flex items-center gap-1 text-sm text-primary">
                <TrendingUp className="h-4 w-4" />
                View details
              </div>
            </Link>
          ))}
        </div>
      )}
    </PaginatedClientList>
  );
}
