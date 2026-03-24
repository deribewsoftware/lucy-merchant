"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useId, useState } from "react"
import {
  Banknote,
  Building2,
  ShoppingBag,
  Trash2,
  Truck,
  Package,
  CreditCard,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { GoogleLocationPicker } from "@/components/google-location-picker"
import type { Cart } from "@/lib/domain/types"

type Props = {
  initial: Cart
  lineTitles: { productId: string; title: string }[]
}

export function MerchantCart({ initial, lineTitles }: Props) {
  const router = useRouter()
  const [cart, setCart] = useState(initial)
  const [location, setLocation] = useState("")
  const [method, setMethod] = useState<"cod" | "bank_transfer">("cod")
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const deliveryFieldId = useId()

  async function remove(productId: string) {
    const res = await fetch(
      `/api/cart?productId=${encodeURIComponent(productId)}`,
      { method: "DELETE" }
    )
    const data = await res.json()
    if (res.ok) setCart(data.cart)
  }

  async function checkout(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deliveryLocation: location,
        paymentMethod: method,
      }),
    })
    const data = await res.json().catch(() => ({}))
    setLoading(false)
    if (!res.ok) {
      setMsg(data.error ?? "Checkout failed")
      return
    }
    router.push("/merchant/orders")
    router.refresh()
  }

  const titleFor = (productId: string) =>
    lineTitles.find((x) => x.productId === productId)?.title ?? productId

  if (cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50">
          <ShoppingBag className="h-10 w-10 text-muted-foreground/50" />
        </div>
        <h3 className="mt-6 text-lg font-semibold text-foreground">Your cart is empty</h3>
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
    )
  }

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      {/* Line Items */}
      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <ShoppingBag className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Line Items</h2>
            <p className="text-xs text-muted-foreground">
              {cart.items.length} item{cart.items.length !== 1 ? "s" : ""} in your cart
            </p>
          </div>
        </div>

        <ul className="space-y-3">
          {cart.items.map((line, index) => (
            <li
              key={line.productId}
              className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              
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
                      {line.quantity} x {line.price.toLocaleString()} ETB
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold text-primary">
                    {line.subtotal.toLocaleString()} ETB
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(line.productId)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Remove line"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Checkout Sidebar */}
      <aside className="w-full shrink-0 lg:sticky lg:top-24 lg:min-w-[min(100%,20rem)] lg:w-[24rem]">
        <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-lg">
          {/* Header */}
          <div className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-accent/5 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Order Total
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {cart.totalAmount.toLocaleString()}
                  <span className="ml-1 text-base font-medium text-muted-foreground">ETB</span>
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={checkout} className="flex flex-col gap-5 p-5">
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

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-foreground">
                Payment Method
              </legend>
              <div className="grid gap-2">
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition-all ${
                    method === "cod"
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    className="h-4 w-4 accent-primary"
                    checked={method === "cod"}
                    onChange={() => setMethod("cod")}
                  />
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                    <Banknote className="h-5 w-5 text-accent" />
                  </div>
                  <span className="min-w-0">
                    <span className="block font-medium text-foreground">
                      Cash on Delivery
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      Pay when your shipment arrives
                    </span>
                  </span>
                </label>
                
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition-all ${
                    method === "bank_transfer"
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    className="h-4 w-4 accent-primary"
                    checked={method === "bank_transfer"}
                    onChange={() => setMethod("bank_transfer")}
                  />
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                    <Building2 className="h-5 w-5 text-blue-500" />
                  </div>
                  <span className="min-w-0">
                    <span className="block font-medium text-foreground">
                      Bank Transfer
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      Instructions provided after acceptance
                    </span>
                  </span>
                </label>
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
                  Placing order...
                </>
              ) : (
                <>
                  <Truck className="h-5 w-5" />
                  Place Order
                </>
              )}
            </button>
          </form>
        </div>
      </aside>
    </div>
  )
}
