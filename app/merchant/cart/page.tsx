import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight, ClipboardList, ShoppingBag, Sparkles } from "lucide-react"
import { MerchantCart } from "@/components/merchant-cart"
import { getProduct } from "@/lib/db/catalog"
import { getCart } from "@/lib/db/commerce"
import { merchantHasOutstandingCommission } from "@/lib/server/merchant-commission"
import { getSessionUser } from "@/lib/server/session"

export default async function MerchantCartPage() {
  const user = await getSessionUser()
  if (user && merchantHasOutstandingCommission(user.id)) {
    redirect("/merchant/orders?hold=commission")
  }
  const cart = user ? getCart(user.id) : null
  const lineTitles =
    cart?.items.map((i) => ({
      productId: i.productId,
      title: getProduct(i.productId)?.name ?? `Listing ${i.productId.slice(0, 8)}...`,
    })) ?? []

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <header className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card via-primary/5 to-accent/5 p-6 sm:p-8">
        {/* Background decoration */}
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-accent/5 blur-2xl" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />
        
        <div className="relative flex flex-wrap items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg shadow-primary/20">
            <ShoppingBag className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Shopping Cart
              </h1>
              <Sparkles className="h-5 w-5 text-accent animate-pulse" />
            </div>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Orders are split by supplier. Bank transfers need admin approval; card and Chapa
              payments show as cleared only after the platform confirms them.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/browse"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary/40 hover:bg-primary/5"
              >
                Continue shopping
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/merchant/orders"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary/40 hover:bg-primary/5"
              >
                <ClipboardList className="h-3.5 w-3.5" />
                My orders
              </Link>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        {cart && (
          <div className="relative mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border/50 bg-background/50 p-4 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Items</p>
              <p className="mt-1 text-xl font-bold text-foreground">
                {cart.items.length}
              </p>
            </div>
            <div className="rounded-xl border border-border/50 bg-background/50 p-4 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Suppliers</p>
              <p className="mt-1 text-xl font-bold text-foreground">
                {[...new Set(cart.items.map((i) => i.companyId))].length}
              </p>
            </div>
            <div className="col-span-2 rounded-xl border border-border/50 bg-background/50 p-4 backdrop-blur-sm sm:col-span-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total</p>
              <p className="mt-1 text-xl font-bold text-primary">
                {cart.totalAmount.toLocaleString()} ETB
              </p>
            </div>
          </div>
        )}
      </header>

      {/* Cart Content */}
      <div>
        {cart ? (
          <MerchantCart initial={cart} lineTitles={lineTitles} />
        ) : (
          <p className="text-sm text-muted-foreground">Unable to load cart.</p>
        )}
      </div>
    </div>
  )
}
