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
      <div className="lm-card">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <LogIn className="h-7 w-7" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              Sign in to order
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a merchant account to add items to your cart
            </p>
          </div>
          <div className="flex w-full flex-col gap-2">
            <Link
              href="/login"
              className="flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="flex h-11 w-full items-center justify-center rounded-lg border border-border bg-card text-sm font-semibold text-foreground transition-colors hover:bg-muted"
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
    <div className="lm-card">
      <h2 className="font-display text-lg font-semibold text-foreground">
        Place Order
      </h2>
      
      {/* Quantity Selector */}
      <div className="mt-5">
        <label className="text-sm font-medium text-foreground">
          Quantity
        </label>
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={decrement}
            disabled={safeQty <= minQty}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="number"
            min={minQty}
            max={cap}
            value={safeQty}
            onChange={(e) => setQty(Number(e.target.value))}
            className="lm-input w-24 text-center text-lg font-semibold"
          />
          <button
            type="button"
            onClick={increment}
            disabled={safeQty >= cap}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Min: {minQty} | Max: {cap} | In stock: {stock}
        </p>
      </div>

      {/* Add to Cart Button */}
      <button
        type="button"
        disabled={loading || cap < minQty}
        onClick={() => add()}
        className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            Adding to cart...
          </>
        ) : (
          <>
            <ShoppingCart className="h-5 w-5" />
            Add to Cart
          </>
        )}
      </button>

      {/* Go to Cart Link */}
      <Link
        href="/merchant/cart"
        className="mt-3 flex h-11 w-full items-center justify-center rounded-lg border border-border bg-card text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        View Cart
      </Link>

      {/* Status Message */}
      <AnimatePresence>
        {msg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mt-4 flex items-center gap-2 rounded-lg p-3 text-sm ${
              msg.type === "success"
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {msg.type === "success" ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {msg.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
