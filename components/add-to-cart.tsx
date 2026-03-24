"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { HiOutlineShoppingCart } from "react-icons/hi2";

type Props = {
  productId: string;
  minQty: number;
  maxQty: number;
  stock: number;
  defaultQty: number;
  isMerchant: boolean;
};

export function AddToCart({
  productId,
  minQty,
  maxQty,
  stock,
  defaultQty,
  isMerchant,
}: Props) {
  const router = useRouter();
  const [qty, setQty] = useState(defaultQty);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isMerchant) {
    return (
      <div className="alert alert-info">
        <span className="text-sm">
          Sign in as a merchant to add items to your cart and check out.
        </span>
      </div>
    );
  }

  async function add() {
    setLoading(true);
    setMsg(null);
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity: qty }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMsg(data.error ?? "Could not add to cart");
      return;
    }
    router.refresh();
    setMsg("Added to cart");
  }

  const cap = Math.min(stock, maxQty);
  const safeQty = Math.min(Math.max(qty, minQty), cap);

  return (
    <div className="card border border-base-300 bg-base-100 shadow-md">
      <div className="card-body gap-4">
        <h2 className="card-title text-lg">Order</h2>
        <label className="form-control w-full">
          <span className="label-text">Quantity</span>
          <input
            type="number"
            min={minQty}
            max={cap}
            value={safeQty}
            onChange={(e) => setQty(Number(e.target.value))}
            className="input input-bordered w-full max-w-xs"
          />
        </label>
        <button
          type="button"
          disabled={loading || cap < minQty}
          onClick={() => add()}
          className="btn btn-primary gap-2"
        >
          {loading ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            <HiOutlineShoppingCart className="h-5 w-5" />
          )}
          {loading ? "Adding…" : "Add to cart"}
        </button>
        {msg && (
          <div
            role="status"
            className={
              msg.toLowerCase().includes("could")
                ? "alert alert-error py-2 text-sm"
                : "alert alert-success py-2 text-sm"
            }
          >
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}
