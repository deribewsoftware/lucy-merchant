"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import {
  HiOutlineBanknotes,
  HiOutlineBuildingOffice2,
  HiOutlineShoppingBag,
  HiOutlineTrash,
  HiOutlineTruck,
} from "react-icons/hi2";
import { GoogleLocationPicker } from "@/components/google-location-picker";
import type { Cart } from "@/lib/domain/types";

type Props = {
  initial: Cart;
  /** Resolved on the server so lines show product names, not raw ids */
  lineTitles: { productId: string; title: string }[];
};

function CartLineArt({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 48"
      fill="none"
      aria-hidden
    >
      <path
        d="M8 36h104M20 20h80l8 16H12L20 20z"
        className="stroke-base-content/20"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="36" cy="38" r="3" className="stroke-secondary/40" strokeWidth="1.2" />
      <circle cx="84" cy="38" r="3" className="stroke-secondary/40" strokeWidth="1.2" />
    </svg>
  );
}

export function MerchantCart({ initial, lineTitles }: Props) {
  const router = useRouter();
  const [cart, setCart] = useState(initial);
  const [location, setLocation] = useState("");
  const [method, setMethod] = useState<"cod" | "bank_transfer">("cod");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const deliveryFieldId = useId();

  async function remove(productId: string) {
    const res = await fetch(
      `/api/cart?productId=${encodeURIComponent(productId)}`,
      { method: "DELETE" },
    );
    const data = await res.json();
    if (res.ok) setCart(data.cart);
  }

  async function checkout(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deliveryLocation: location,
        paymentMethod: method,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMsg(data.error ?? "Checkout failed");
      return;
    }
    router.push("/merchant/orders");
    router.refresh();
  }

  const titleFor = (productId: string) =>
    lineTitles.find((x) => x.productId === productId)?.title ?? productId;

  if (cart.items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-base-300 bg-base-100/80 px-6 py-12 text-center shadow-inner">
        <CartLineArt className="mx-auto mb-4 h-12 w-28 text-base-content/30" />
        <p className="text-base-content/80">
          Your cart is empty — start a procurement run from the catalog.
        </p>
        <Link
          href="/browse"
          className="btn btn-primary btn-sm mt-6 gap-2 rounded-xl"
        >
          <HiOutlineShoppingBag className="h-4 w-4" />
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
            <HiOutlineShoppingBag className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-base-content">
              Line items
            </h2>
            <p className="text-xs text-base-content/55">
              Remove lines before checkout if quantities change.
            </p>
          </div>
        </div>
        <ul className="space-y-3">
          {cart.items.map((line) => (
            <li
              key={line.productId}
              className="rounded-2xl border border-base-300 bg-base-100 shadow-sm ring-1 ring-base-300/15"
            >
              <div className="flex flex-row flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-base-content">
                    {titleFor(line.productId)}
                  </p>
                  <p className="mt-1 text-sm text-base-content/60">
                    {line.quantity} × {line.price.toLocaleString()} ETB
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-primary">
                    {line.subtotal.toLocaleString()} ETB
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(line.productId)}
                    className="btn btn-ghost btn-square btn-sm text-error hover:bg-error/10"
                    aria-label="Remove line"
                  >
                    <HiOutlineTrash className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <aside className="w-full shrink-0 lg:sticky lg:top-24 lg:min-w-[min(100%,20rem)] lg:w-[24rem]">
        <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-md ring-1 ring-base-300/20">
          <div className="flex items-start gap-3 border-b border-base-300 pb-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <HiOutlineTruck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
                Checkout
              </p>
              <p className="mt-1 text-3xl font-bold text-primary">
                {cart.totalAmount.toLocaleString()}{" "}
                <span className="text-lg font-semibold text-base-content/50">
                  ETB
                </span>
              </p>
            </div>
          </div>

          <form onSubmit={checkout} className="mt-5 flex flex-col gap-5">
            <GoogleLocationPicker
              inputId={deliveryFieldId}
              label="Delivery location"
              required
              value={location}
              onChange={setLocation}
              helperText="Search for your address, then refine the text if needed."
              variant="daisy"
              addressMode="full"
              mapHeightPx={200}
            />

            <fieldset className="space-y-2">
              <legend className="mb-1 text-sm font-medium text-base-content">
                Payment method
              </legend>
              <div className="grid gap-2 sm:grid-cols-1">
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition ${
                    method === "cod"
                      ? "border-primary bg-primary/5"
                      : "border-base-300 hover:border-base-content/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    className="radio radio-primary radio-sm"
                    checked={method === "cod"}
                    onChange={() => setMethod("cod")}
                  />
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
                    <HiOutlineBanknotes className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 text-sm">
                    <span className="font-medium text-base-content">
                      Cash on delivery
                    </span>
                    <span className="mt-0.5 block text-xs text-base-content/55">
                      Pay the courier when your shipment arrives.
                    </span>
                  </span>
                </label>
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition ${
                    method === "bank_transfer"
                      ? "border-primary bg-primary/5"
                      : "border-base-300 hover:border-base-content/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    className="radio radio-primary radio-sm"
                    checked={method === "bank_transfer"}
                    onChange={() => setMethod("bank_transfer")}
                  />
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                    <HiOutlineBuildingOffice2 className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 text-sm">
                    <span className="font-medium text-base-content">
                      Bank transfer
                    </span>
                    <span className="mt-0.5 block text-xs text-base-content/55">
                      Follow instructions from suppliers after order acceptance.
                    </span>
                  </span>
                </label>
              </div>
            </fieldset>

            {msg && (
              <div role="alert" className="alert alert-error text-sm">
                {msg}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary h-12 w-full gap-2 rounded-xl text-base"
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <HiOutlineTruck className="h-5 w-5" />
              )}
              {loading ? "Placing order…" : "Place order"}
            </button>
          </form>
        </div>
      </aside>
    </div>
  );
}
