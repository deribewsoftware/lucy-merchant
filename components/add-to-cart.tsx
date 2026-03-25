"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  CheckCircle,
  LogIn,
  Minus,
  Plus,
  ShoppingCart,
} from "lucide-react";

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
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const cap = Math.min(stock, maxQty);
  const safeQty = Math.min(Math.max(qty, minQty), cap);

  if (!isMerchant) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-lg ring-1 ring-border/20">
        <div className="border-b border-border/40 bg-gradient-to-r from-primary/[0.07] to-transparent px-5 py-4 sm:px-6">
          <h2 className="font-display text-lg font-bold text-foreground">
            Order this product
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Merchant accounts can add to cart and checkout.
          </p>
        </div>
        <div className="flex flex-col items-center gap-5 px-5 py-8 text-center sm:px-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <LogIn className="h-8 w-8" />
          </div>
          <div className="max-w-xs">
            <h3 className="font-display text-base font-semibold text-foreground">
              Sign in to order
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Create a merchant account to build your cart and place orders with
              verified suppliers.
            </p>
          </div>
          <div className="flex w-full max-w-sm flex-col gap-2.5">
            <Link
              href="/login"
              className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="flex h-12 w-full items-center justify-center rounded-xl border border-border/60 bg-card text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  async function add() {
    setLoading(true);
    setMsg(null);
    const res = await fetch("/api/cart", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity: safeQty }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMsg({ type: "error", text: data.error ?? "Could not add to cart" });
      return;
    }
    router.refresh();
    setMsg({ type: "success", text: "Added to cart!" });
    setTimeout(() => setMsg(null), 3000);
  }

  function increment() {
    if (safeQty < cap) setQty(safeQty + 1);
  }

  function decrement() {
    if (safeQty > minQty) setQty(safeQty - 1);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-lg ring-1 ring-border/20">
      <div className="border-b border-border/40 bg-gradient-to-r from-primary/[0.08] to-transparent px-5 py-4 sm:px-6">
        <h2 className="font-display text-lg font-bold text-foreground">
          Add to cart
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose quantity, then add to your merchant cart.
        </p>
      </div>

      <div className="space-y-6 px-5 py-6 sm:px-6">
        <div>
          <label
            className="text-sm font-semibold text-foreground"
            htmlFor="product-qty"
          >
            Quantity
          </label>
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={decrement}
              disabled={safeQty <= minQty}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card text-foreground transition hover:bg-muted disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </button>
            <input
              id="product-qty"
              type="number"
              min={minQty}
              max={cap}
              value={safeQty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="lm-input max-w-[6rem] flex-1 text-center text-lg font-bold tabular-nums"
            />
            <button
              type="button"
              onClick={increment}
              disabled={safeQty >= cap}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card text-foreground transition hover:bg-muted disabled:opacity-40"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Min {minQty} · Max {cap} · In stock {stock.toLocaleString()}
          </p>
        </div>

        <button
          type="button"
          disabled={loading || cap < minQty}
          onClick={() => add()}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90 active:scale-[0.99] disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              Adding…
            </>
          ) : (
            <>
              <ShoppingCart className="h-5 w-5" />
              Add to cart
            </>
          )}
        </button>

        <Link
          href="/merchant/cart"
          className="flex h-11 w-full items-center justify-center rounded-xl border border-border/60 bg-transparent text-sm font-medium text-foreground transition hover:bg-muted"
        >
          View cart
        </Link>

        <AnimatePresence>
          {msg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm ${
                msg.type === "success"
                  ? "bg-success/12 text-success"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {msg.type === "success" ? (
                <CheckCircle className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              {msg.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
