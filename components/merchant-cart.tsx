"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import {
  AlertCircle,
  Banknote,
  Building2,
  Loader2,
  Package,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";
import { EthiopianDeliveryLocation } from "@/components/ethiopian-delivery-location";
import { FulfillmentHandoffPicker } from "@/components/fulfillment-handoff-picker";
import { PaginatedClientList } from "@/components/paginated-client-list";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Cart, OrderFulfillmentHandoff, PaymentMethod } from "@/lib/domain/types";

type Props = {
  initial: Cart;
  lineTitles: { productId: string; title: string }[];
};

/** Direct payment to suppliers only (cash on delivery or bank transfer to supplier account). */
const METHODS: { id: PaymentMethod; title: string; hint: string }[] = [
  {
    id: "cod",
    title: "Cash to supplier",
    hint: "Pay the supplier in cash when you receive the goods",
  },
  {
    id: "bank_transfer",
    title: "Bank transfer to supplier",
    hint: "Transfer to the supplier’s company account (shown after checkout)",
  },
];

export function MerchantCart({ initial, lineTitles }: Props) {
  const router = useRouter();
  const [cart, setCart] = useState(initial);
  const [location, setLocation] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cod");
  const [fulfillmentHandoff, setFulfillmentHandoff] =
    useState<OrderFulfillmentHandoff>("supplier_delivers_to_shop");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkoutConfirmOpen, setCheckoutConfirmOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{
    productId: string;
    title: string;
  } | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const checkoutInFlight = useRef(false);
  const deliveryFieldId = useId();

  useEffect(() => {
    setCart(initial);
  }, [initial]);

  async function performRemoveLine() {
    if (!removeTarget) return;
    setRemoveBusy(true);
    try {
      const res = await fetch(
        `/api/cart?productId=${encodeURIComponent(removeTarget.productId)}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (res.ok) {
        setCart(data.cart);
        setRemoveTarget(null);
      }
    } finally {
      setRemoveBusy(false);
    }
  }

  async function checkout(e: React.FormEvent) {
    e.preventDefault();
    if (checkoutInFlight.current) return;
    if (!location.trim()) {
      setMsg("Enter a delivery location (search or fill region, city, woreda, kebele, and street).");
      return;
    }
    setCheckoutConfirmOpen(true);
  }

  async function performCheckout() {
    if (checkoutInFlight.current) return;
    checkoutInFlight.current = true;
    setLoading(true);
    setMsg(null);
    try {
      const sync = await fetch("/api/cart", { credentials: "include" });
      const syncData = await sync.json().catch(() => ({}));
      if (sync.ok && syncData.cart) {
        setCart(syncData.cart);
        if (!syncData.cart.items?.length) {
          setMsg(
            "Your cart is empty. Add items from the catalog, then try again.",
          );
          setCheckoutConfirmOpen(false);
          return;
        }
      }
      const res = await fetch("/api/checkout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryLocation: location,
          paymentMethod: method,
          fulfillmentHandoff,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data.error ?? "Checkout failed");
        return;
      }
      setCheckoutConfirmOpen(false);
      const firstId = data.orders?.[0]?.id as string | undefined;
      if (firstId) {
        router.push(`/merchant/orders/${firstId}`);
      } else {
        router.push("/merchant/orders");
      }
      router.refresh();
    } catch {
      setMsg("Checkout failed. Check your connection and try again.");
    } finally {
      setLoading(false);
      checkoutInFlight.current = false;
    }
  }

  const titleFor = (productId: string) =>
    lineTitles.find((x) => x.productId === productId)?.title ?? productId;

  function iconFor(m: PaymentMethod) {
    switch (m) {
      case "cod":
        return <Banknote className="h-5 w-5 text-accent" />;
      case "bank_transfer":
        return <Building2 className="h-5 w-5 text-blue-500" />;
      default:
        return <Banknote className="h-5 w-5" />;
    }
  }

  if (cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/40 bg-card/50 px-6 py-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50">
          <ShoppingBag className="h-10 w-10 text-muted-foreground/50" />
        </div>
        <h3 className="mt-6 text-lg font-semibold text-foreground">
          Your cart is empty
        </h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Start a procurement run from the catalog.
        </p>
        <Link
          href="/browse"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90"
        >
          <Package className="h-4 w-4" />
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <ShoppingBag className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Line items</h2>
            <p className="text-xs text-muted-foreground">
              One order per supplier at checkout — pay each supplier directly.
            </p>
          </div>
        </div>

        <PaginatedClientList
          items={cart.items}
          pageSize={8}
          resetKey={cart.items.map((l) => l.productId).join(",")}
          summaryClassName="mb-3"
          summarySuffix="line items"
          barClassName="mt-4"
        >
          {(pageItems) => (
            <ul className="space-y-3">
              {pageItems.map((line, index) => (
                <li
                  key={line.productId}
                  className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="relative flex flex-row flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">
                          {titleFor(line.productId)}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {line.quantity} × {line.price.toLocaleString()} ETB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold text-primary">
                        {line.subtotal.toLocaleString()} ETB
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setRemoveTarget({
                            productId: line.productId,
                            title: titleFor(line.productId),
                          })
                        }
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Remove line"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </PaginatedClientList>
      </div>

      <aside className="w-full shrink-0 lg:sticky lg:top-24 lg:min-w-[min(100%,20rem)] lg:w-[24rem]">
        <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-lg">
          <div className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-accent/5 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Checkout
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {cart.totalAmount.toLocaleString()}
                  <span className="ml-1 text-base font-medium text-muted-foreground">
                    ETB
                  </span>
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              You pay suppliers directly. After delivery, you record your buyer
              platform fee and the supplier records theirs (when applicable);
              they confirm they received payment for the goods; then you can
              complete the order and leave reviews.
            </p>
          </div>

          <form onSubmit={checkout} className="flex flex-col gap-5 p-5">
            <FulfillmentHandoffPicker
              value={fulfillmentHandoff}
              onChange={setFulfillmentHandoff}
            />

            <EthiopianDeliveryLocation
              inputId={deliveryFieldId}
              label={
                fulfillmentHandoff === "merchant_pickup_at_supplier"
                  ? "Address & pickup notes"
                  : "Delivery location"
              }
              required
              value={location}
              onChange={setLocation}
              helperText={
                fulfillmentHandoff === "merchant_pickup_at_supplier"
                  ? "Optional notes or the supplier’s address for your records. Lock the exact pickup point and time in order chat."
                  : "Search for your shop or business address, then refine if needed—the supplier brings the order here."
              }
              variant="daisy"
            />

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-foreground">
                How you pay the supplier
              </legend>
              <div className="grid max-h-[min(360px,80vh)] gap-2 overflow-y-auto pr-1">
                {METHODS.map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${
                      method === opt.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border/50 hover:border-primary/35"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      className="h-4 w-4 accent-primary"
                      checked={method === opt.id}
                      onChange={() => setMethod(opt.id)}
                    />
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                      {iconFor(opt.id)}
                    </div>
                    <span className="min-w-0">
                      <span className="block font-medium text-foreground">
                        {opt.title}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {opt.hint}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {msg && (
              <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {msg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Placing order…
                </>
              ) : (
                <>
                  <Truck className="h-5 w-5" />
                  Place order
                </>
              )}
            </button>
          </form>
        </div>
      </aside>

      <ConfirmDialog
        open={removeTarget !== null}
        onOpenChange={(o) => !o && setRemoveTarget(null)}
        title="Remove from cart?"
        description={
          removeTarget ? (
            <>
              <span className="font-medium text-foreground">
                {removeTarget.title}
              </span>{" "}
              will be removed from your cart. You can add it again from the catalog.
            </>
          ) : null
        }
        variant="danger"
        confirmLabel="Remove"
        cancelLabel="Keep in cart"
        loading={removeBusy}
        onConfirm={performRemoveLine}
      />
      <ConfirmDialog
        open={checkoutConfirmOpen}
        onOpenChange={setCheckoutConfirmOpen}
        title="Place order?"
        description={
          <>
            You will create one order per supplier with a total of{" "}
            <span className="font-semibold text-foreground">
              {cart.totalAmount.toLocaleString()} ETB
            </span>
            . You pay suppliers directly using the method you chose. Continue?
          </>
        }
        variant="primary"
        confirmLabel="Place order"
        cancelLabel="Not yet"
        loading={loading}
        onConfirm={performCheckout}
      />
    </div>
  );
}
