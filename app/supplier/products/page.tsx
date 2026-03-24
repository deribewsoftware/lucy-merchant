import Link from "next/link";
import {
  HiArrowRight,
  HiOutlineCube,
  HiOutlineSparkles,
} from "react-icons/hi2";
import { ProductOrderSpecs } from "@/components/product-order-specs";
import { ProductUnitPrice } from "@/components/product-unit-price";
import { SupplierDeleteProductButton } from "@/components/supplier-delete-product-button";
import { SupplierHeroBackdrop } from "@/components/supplier/supplier-portal-graphics";
import { getCompany, productsForOwner } from "@/lib/db/catalog";
import { getSessionUser } from "@/lib/server/session";

export default async function SupplierProductsPage() {
  const user = await getSessionUser();
  const rows = user ? productsForOwner(user.id) : [];

  return (
    <div className="space-y-10">
      <header className="relative overflow-hidden rounded-2xl border border-base-300 bg-gradient-to-br from-base-100 via-primary/[0.05] to-secondary/[0.08] p-6 shadow-sm ring-1 ring-base-300/25 sm:p-8">
        <SupplierHeroBackdrop />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
              <HiOutlineCube className="h-7 w-7" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-base-content sm:text-3xl">
                Your listings
              </h1>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-base-content/70">
                Edit pricing, stock, and imagery, or remove SKUs from the marketplace.
                Featured items show a sparkle badge in this list.
              </p>
            </div>
          </div>
          <Link
            href="/supplier/products/new"
            className="btn btn-primary btn-sm gap-2 self-start rounded-xl sm:btn-md sm:self-center"
          >
            New listing
            <HiArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <ul className="space-y-4">
        {rows.length === 0 && (
          <li className="rounded-2xl border border-dashed border-base-300 bg-base-200/20 px-6 py-12 text-center">
            <p className="text-sm text-base-content/70">
              No products yet.{" "}
              <Link href="/supplier/products/new" className="link link-primary font-semibold">
                Post your first listing
              </Link>
              .
            </p>
          </li>
        )}
        {rows.map((p) => {
          const co = getCompany(p.companyId);
          return (
            <li
              key={p.id}
              className="flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm transition hover:border-primary/25 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-base-200 text-base-content/70">
                  {p.isFeatured ? (
                    <HiOutlineSparkles className="h-5 w-5 text-secondary" />
                  ) : (
                    <HiOutlineCube className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-base-content">{p.name}</p>
                  <p className="mt-0.5 text-xs text-base-content/55">
                    {co?.name ?? "Company"} ·{" "}
                    <ProductUnitPrice
                      price={p.price}
                      compareAtPrice={p.compareAtPrice}
                      strikeClassName="text-base-content/40 line-through decoration-base-content/40"
                      saleClassName="font-medium text-base-content/80"
                    />
                    {p.isFeatured ? (
                      <span className="ml-1 inline-flex items-center gap-0.5 text-secondary">
                        · featured
                      </span>
                    ) : null}
                  </p>
                  <ProductOrderSpecs
                    className="mt-1"
                    tone="muted"
                    size="sm"
                    includeStock
                    product={p}
                  />
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Link
                  href={`/products/${p.id}`}
                  className="btn btn-outline btn-sm rounded-xl border-base-300"
                >
                  View live
                </Link>
                <Link
                  href={`/supplier/products/${p.id}/edit`}
                  className="btn btn-neutral btn-sm rounded-xl"
                >
                  Edit
                </Link>
                <SupplierDeleteProductButton productId={p.id} name={p.name} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
