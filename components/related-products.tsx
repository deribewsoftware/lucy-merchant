import Link from "next/link";
import { ProductOrderSpecs } from "@/components/product-order-specs";
import { ProductUnitPrice } from "@/components/product-unit-price";
import type { Product } from "@/lib/domain/types";

type Props = { products: Product[] };

export function RelatedProducts({ products }: Props) {
  if (products.length === 0) return null;

  return (
    <section className="mt-14 border-t border-base-300 pt-12">
      <h2 className="text-xl font-bold">Related in this category</h2>
      <p className="mt-1 text-sm text-base-content/65">
        Other verified listings in the same aisle — by demand and rating.
      </p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <li key={p.id}>
            <Link
              href={`/products/${p.id}`}
              className="card group h-full overflow-hidden border border-base-300 bg-base-100 shadow-md transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
            >
              {p.imageUrl ? (
                <figure className="relative aspect-[16/10] w-full bg-base-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  {p.isFeatured ? (
                    <span className="badge badge-warning absolute end-2 top-2 text-[10px] uppercase">
                      Featured
                    </span>
                  ) : null}
                </figure>
              ) : null}
              <div className="card-body p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="card-title line-clamp-2 text-sm font-semibold group-hover:text-primary">
                    {p.name}
                  </h3>
                  {p.isFeatured && !p.imageUrl ? (
                    <span className="badge badge-warning badge-sm uppercase">
                      Featured
                    </span>
                  ) : null}
                </div>
                <div className="space-y-1 text-sm">
                  <ProductUnitPrice
                    price={p.price}
                    compareAtPrice={p.compareAtPrice}
                    saleClassName="font-bold text-primary"
                  />
                  <ProductOrderSpecs
                    size="sm"
                    product={{
                      minOrderQuantity: p.minOrderQuantity,
                      maxDeliveryQuantity: p.maxDeliveryQuantity,
                      deliveryTime: p.deliveryTime,
                      availableQuantity: p.availableQuantity,
                      itemsPerCarton: p.itemsPerCarton,
                      itemsPerRim: p.itemsPerRim,
                      itemsPerDozen: p.itemsPerDozen,
                    }}
                  />
                </div>
                <p className="text-xs text-base-content/55">
                  {p.averageRating.toFixed(1)}★ · {p.totalOrdersCount} orders
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
