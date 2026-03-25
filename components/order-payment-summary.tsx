import { merchantPaymentSummary } from "@/lib/domain/order-presentations";
import {
  isMerchantPlatformCommissionPaid,
  isSupplierPlatformCommissionPaid,
  platformRevenueRecordedEtb,
} from "@/lib/domain/platform-commission";
import type { Order, Payment, PaymentMethod } from "@/lib/domain/types";

type SummaryVariant = "default" | "portal" | "merchant";

function methodLabel(method: PaymentMethod | undefined): string {
  switch (method) {
    case "bank_transfer":
      return "Bank transfer (to supplier)";
    case "cod":
      return "Cash on delivery";
    case "stripe":
      return "Stripe (card)";
    case "chapa":
      return "Chapa";
    case "telebirr":
      return "Telebirr";
    default:
      return "—";
  }
}

type Props = {
  order: Order;
  payments: Payment[];
  /** default = zinc; portal = Daisy supplier/admin; merchant = SidebarLayout tokens */
  variant?: SummaryVariant;
  /** Merchant sees buyer-friendly payment copy; admin/supplier see raw ledger status. */
  audience?: "merchant" | "admin" | "supplier";
};

function merchantToneClass(tone: "success" | "warning" | "neutral" | "error") {
  switch (tone) {
    case "success":
      return "badge badge-success badge-sm font-semibold";
    case "error":
      return "badge badge-error badge-sm font-semibold";
    case "warning":
      return "badge badge-warning badge-sm font-semibold";
    default:
      return "badge badge-ghost badge-sm border border-base-300 font-semibold";
  }
}

function merchantToneClassDefault(tone: "success" | "warning" | "neutral" | "error") {
  switch (tone) {
    case "success":
      return "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200";
    case "error":
      return "rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-950 dark:text-red-200";
    case "warning":
      return "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200";
    default:
      return "rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200";
  }
}

/** Merchant portal (SidebarLayout) — semantic tokens */
function merchantToneMerchant(tone: "success" | "warning" | "neutral" | "error") {
  switch (tone) {
    case "success":
      return "inline-flex rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-500/25 dark:text-emerald-200";
    case "error":
      return "inline-flex rounded-full bg-destructive/15 px-2.5 py-1 text-xs font-semibold text-destructive ring-1 ring-destructive/30";
    case "warning":
      return "inline-flex rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-500/25 dark:text-amber-200";
    default:
      return "inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground ring-1 ring-border/50";
  }
}

function resolveVariant(variant: SummaryVariant | undefined) {
  const v = variant ?? "default";
  if (v === "merchant") {
    return {
      shell:
        "rounded-xl border border-border/50 bg-card/95 p-3 shadow-sm ring-1 ring-border/20 backdrop-blur-sm sm:p-4",
      title: "text-base font-semibold tracking-tight text-foreground",
      dt: "text-muted-foreground",
      dd: "text-foreground",
      ddStrong: "font-semibold text-foreground",
      dl: "mt-4 space-y-3 text-sm text-foreground",
      listBorder: "border-border/50 text-muted-foreground",
      paymentLi:
        "flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/40 bg-muted/30 px-2.5 py-2",
    };
  }
  if (v === "portal") {
    return {
      shell:
        "rounded-xl border border-base-300 bg-gradient-to-br from-base-100 to-base-200/35 p-3 shadow-sm ring-1 ring-base-300/25 sm:p-4",
      title: "text-sm font-semibold text-base-content",
      dt: "text-base-content/50",
      dd: "text-base-content",
      ddStrong: "font-semibold text-base-content",
      dl: "mt-3 space-y-2 text-sm",
      listBorder: "border-base-300 text-base-content/65",
      paymentLi:
        "flex flex-wrap items-center justify-between gap-2 rounded-lg bg-base-200/40 px-2.5 py-2 dark:bg-base-300/20",
    };
  }
  return {
    shell:
      "rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/40",
    title: "text-sm font-semibold text-zinc-900 dark:text-zinc-50",
    dt: "text-zinc-500 dark:text-zinc-400",
    dd: "",
    ddStrong: "font-semibold text-zinc-900 dark:text-zinc-50",
    dl: "mt-3 space-y-2 text-sm text-zinc-700 dark:text-zinc-300",
    listBorder: "border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400",
    paymentLi: "flex flex-wrap justify-between gap-2",
  };
}

function statusBadge(
  status: Order["paymentStatus"],
  variant: SummaryVariant,
) {
  if (variant === "portal") {
    if (status === "paid")
      return <span className="badge badge-success badge-sm font-semibold">Paid</span>;
    if (status === "failed")
      return <span className="badge badge-error badge-sm font-semibold">Failed</span>;
    return (
      <span className="badge badge-warning badge-sm font-semibold">Pending</span>
    );
  }
  if (status === "paid")
    return (
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
        Paid
      </span>
    );
  if (status === "failed")
    return (
      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-950 dark:text-red-200">
        Failed
      </span>
    );
  return (
    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">
      Pending
    </span>
  );
}

export function OrderPaymentSummary({
  order,
  payments,
  variant = "default",
  audience = "admin",
}: Props) {
  const method = methodLabel(order.paymentMethod);
  const merchantView =
    audience === "merchant" ? merchantPaymentSummary(order) : null;

  const platformFeesRecorded = platformRevenueRecordedEtb(order);
  const buyerFeeRecorded =
    (order.commissionAmount ?? 0) > 0 && isMerchantPlatformCommissionPaid(order);
  const supplierFeeRecorded =
    (order.supplierCommissionAmount ?? 0) > 0 &&
    isSupplierPlatformCommissionPaid(order);

  const s = resolveVariant(variant);

  function toneClass(t: "success" | "warning" | "neutral" | "error") {
    if (variant === "portal") return merchantToneClass(t);
    if (variant === "merchant") return merchantToneMerchant(t);
    return merchantToneClassDefault(t);
  }

  function subTextClass() {
    if (variant === "portal") return "text-[11px] leading-snug text-base-content/55";
    if (variant === "merchant")
      return "text-[11px] leading-snug text-muted-foreground";
    return "text-[11px] leading-snug text-zinc-500 dark:text-zinc-400";
  }

  return (
    <section className={s.shell}>
      <h2 className={s.title}>Payment</h2>
      <dl className={s.dl}>
        <div className="flex flex-wrap justify-between gap-2">
          <dt className={s.dt}>Method</dt>
          <dd className={s.dd}>{method}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <dt className={s.dt}>Order payment</dt>
          <dd className="max-w-[min(100%,14rem)] text-end sm:max-w-none">
            {merchantView ? (
              <div className="flex flex-col items-end gap-1">
                <span className={toneClass(merchantView.tone)}>
                  {merchantView.headline}
                </span>
                {merchantView.sub ? (
                  <span className={subTextClass()}>{merchantView.sub}</span>
                ) : null}
              </div>
            ) : (
              statusBadge(order.paymentStatus, variant)
            )}
          </dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <dt className={s.dt}>Total</dt>
          <dd className={s.ddStrong}>
            {order.totalPrice.toLocaleString()} ETB
          </dd>
        </div>
        {audience === "merchant" && (order.commissionAmount ?? 0) > 0 ? (
          <div className="flex flex-wrap justify-between gap-2">
            <dt className={s.dt}>Merchant platform fee</dt>
            <dd className={`${s.ddStrong} text-end`}>
              {buyerFeeRecorded
                ? `${order.commissionAmount.toLocaleString()} ETB`
                : `${order.commissionAmount.toLocaleString()} ETB · pending`}
            </dd>
          </div>
        ) : null}
        {audience === "supplier" && (order.supplierCommissionAmount ?? 0) > 0 ? (
          <div className="flex flex-wrap justify-between gap-2">
            <dt className={s.dt}>Supplier platform fee</dt>
            <dd className={`${s.ddStrong} text-end`}>
              {supplierFeeRecorded
                ? `${(order.supplierCommissionAmount ?? 0).toLocaleString()} ETB`
                : `${(order.supplierCommissionAmount ?? 0).toLocaleString()} ETB · pending`}
            </dd>
          </div>
        ) : null}
        {audience !== "merchant" && audience !== "supplier" && platformFeesRecorded > 0 ? (
          <>
            <div className="flex flex-wrap justify-between gap-2">
              <dt className={s.dt}>Platform fees (recorded)</dt>
              <dd className={s.ddStrong}>
                {platformFeesRecorded.toLocaleString()} ETB
              </dd>
            </div>
            {(order.commissionAmount ?? 0) > 0 ||
            (order.supplierCommissionAmount ?? 0) > 0 ? (
              <div className={`flex flex-wrap gap-x-4 gap-y-1 text-[11px] ${subTextClass()}`}>
                {(order.commissionAmount ?? 0) > 0 ? (
                  <span>
                    Merchant → platform:{" "}
                    {buyerFeeRecorded
                      ? `${order.commissionAmount.toLocaleString()} ETB`
                      : "pending"}
                  </span>
                ) : null}
                {(order.supplierCommissionAmount ?? 0) > 0 ? (
                  <span>
                    Supplier → platform:{" "}
                    {supplierFeeRecorded
                      ? `${(order.supplierCommissionAmount ?? 0).toLocaleString()} ETB`
                      : "pending"}
                  </span>
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}
      </dl>
      {payments.length > 0 && (
        <ul className={`mt-3 space-y-2 border-t pt-3 text-xs ${s.listBorder}`}>
          {payments.map((p) => (
            <li key={p.id} className={s.paymentLi}>
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
    </section>
  );
}
