import type { Order, Payment } from "@/lib/domain/types";

type Props = {
  order: Order;
  payments: Payment[];
};

function statusBadge(status: Order["paymentStatus"]) {
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

export function OrderPaymentSummary({ order, payments }: Props) {
  const methodLabel =
    order.paymentMethod === "bank_transfer"
      ? "Bank transfer"
      : order.paymentMethod === "cod"
        ? "Cash on delivery"
        : "—";

  return (
    <section className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Payment
      </h2>
      <dl className="mt-3 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
        <div className="flex flex-wrap justify-between gap-2">
          <dt className="text-zinc-500 dark:text-zinc-400">Method</dt>
          <dd>{methodLabel}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <dt className="text-zinc-500 dark:text-zinc-400">Order payment</dt>
          <dd>{statusBadge(order.paymentStatus)}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <dt className="text-zinc-500 dark:text-zinc-400">Total</dt>
          <dd className="font-semibold text-zinc-900 dark:text-zinc-50">
            {order.totalPrice.toLocaleString()} ETB
          </dd>
        </div>
      </dl>
      {payments.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-zinc-200 pt-3 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          {payments.map((p) => (
            <li key={p.id} className="flex flex-wrap justify-between gap-2">
              <span className="font-mono opacity-80">{p.id.slice(0, 8)}…</span>
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
