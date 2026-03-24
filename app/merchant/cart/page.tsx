import { HiOutlineShoppingBag } from "react-icons/hi2";
import { MerchantCart } from "@/components/merchant-cart";
import { getProduct } from "@/lib/db/catalog";
import { getCart } from "@/lib/db/commerce";
import { getSessionUser } from "@/lib/server/session";

export default async function MerchantCartPage() {
  const user = await getSessionUser();
  const cart = user ? getCart(user.id) : null;
  const lineTitles =
    cart?.items.map((i) => ({
      productId: i.productId,
      title: getProduct(i.productId)?.name ?? `Listing ${i.productId.slice(0, 8)}…`,
    })) ?? [];
  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-2xl border border-base-300 bg-gradient-to-r from-base-100 via-secondary/[0.04] to-primary/[0.05] p-6 sm:p-7">
        <div
          className="pointer-events-none absolute -right-8 top-0 h-32 w-32 text-secondary/15"
          aria-hidden
        >
          <svg viewBox="0 0 100 100" fill="none" className="h-full w-full">
            <circle cx="78" cy="28" r="36" stroke="currentColor" strokeWidth="1.2" />
            <path
              d="M20 72h60M30 52h40"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="relative flex flex-wrap items-start gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/15 text-secondary">
            <HiOutlineShoppingBag className="h-6 w-6" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-base-content">
              Cart
            </h1>
            <p className="mt-1 max-w-xl text-sm text-base-content/65">
              Multi-supplier checkout with delivery lookup, payment choice, and a
              single order per submission — same flow suppliers see on their side.
            </p>
          </div>
        </div>
      </header>

      <div>
        {cart ? (
          <MerchantCart initial={cart} lineTitles={lineTitles} />
        ) : (
          <p className="text-sm text-base-content/60">Unable to load cart.</p>
        )}
      </div>
    </div>
  );
}
