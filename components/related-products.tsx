"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useCallback, useState } from "react";
import { Pagination } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import { ProductOrderSpecs } from "@/components/product-order-specs";
import { ProductUnitPrice } from "@/components/product-unit-price";
import type { Product } from "@/lib/domain/types";

import "swiper/css";
import "swiper/css/pagination";

type Props = { products: Product[] };

export function RelatedProducts({ products }: Props) {
  const [swiper, setSwiper] = useState<SwiperClass | null>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const syncNav = useCallback((s: SwiperClass) => {
    setAtStart(s.isBeginning);
    setAtEnd(s.isEnd);
  }, []);

  if (products.length === 0) return null;

  const showNav = products.length > 1;

  return (
    <section
      className="border-t border-border/60 pt-10 sm:pt-12"
      aria-labelledby="related-products-heading"
    >
      <div className="min-w-0">
        <h2
          id="related-products-heading"
          className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl"
        >
          Related in this category
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Other verified listings in the same aisle — by demand and rating.
        </p>
      </div>

      <div className="related-products-swiper relative mt-5 min-w-0 sm:mt-7">
        <div className="relative -mx-4 min-w-0 px-4 sm:mx-0 sm:px-0">
          {showNav ? (
            <>
              <button
                type="button"
                className="related-nav-btn related-nav-prev pointer-events-auto absolute left-1 top-[40%] z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border/80 bg-card/95 text-foreground shadow-md ring-1 ring-border/30 backdrop-blur-sm transition hover:border-primary/45 hover:bg-primary/10 hover:text-primary active:scale-[0.97] disabled:pointer-events-none disabled:opacity-25 md:left-0 md:flex"
                aria-label="Previous related products"
                disabled={atStart}
                onClick={() => swiper?.slidePrev()}
              >
                <ChevronLeft className="h-5 w-5 shrink-0" strokeWidth={2.25} />
              </button>
              <button
                type="button"
                className="related-nav-btn related-nav-next pointer-events-auto absolute right-1 top-[40%] z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border/80 bg-card/95 text-foreground shadow-md ring-1 ring-border/30 backdrop-blur-sm transition hover:border-primary/45 hover:bg-primary/10 hover:text-primary active:scale-[0.97] disabled:pointer-events-none disabled:opacity-25 md:right-0 md:flex"
                aria-label="Next related products"
                disabled={atEnd}
                onClick={() => swiper?.slideNext()}
              >
                <ChevronRight className="h-5 w-5 shrink-0" strokeWidth={2.25} />
              </button>
            </>
          ) : null}

          <Swiper
            className="related-swiper !pb-11 sm:!pb-3 md:!pb-2"
            modules={[Pagination]}
            grabCursor
            watchOverflow
            slidesPerView={1.06}
            spaceBetween={12}
            centeredSlides={false}
            pagination={
              showNav
                ? {
                    clickable: true,
                    dynamicBullets: true,
                    dynamicMainBullets: 5,
                  }
                : false
            }
            onSwiper={(s) => {
              setSwiper(s);
              syncNav(s);
            }}
            onSlideChange={syncNav}
            onBreakpoint={syncNav}
            onResize={syncNav}
            breakpoints={{
              0: {
                slidesPerView: 1.06,
                spaceBetween: 12,
              },
              420: {
                slidesPerView: 1.22,
                spaceBetween: 14,
              },
              640: {
                slidesPerView: 2,
                spaceBetween: 16,
              },
              900: {
                slidesPerView: 2,
                spaceBetween: 18,
              },
              1024: {
                slidesPerView: 3,
                spaceBetween: 20,
              },
              1280: {
                slidesPerView: 3,
                spaceBetween: 22,
              },
              1536: {
                slidesPerView: 4,
                spaceBetween: 22,
              },
            }}
          >
            {products.map((p) => (
              <SwiperSlide key={p.id} className="!h-auto">
                <Link
                  href={`/products/${p.id}`}
                  className="group flex h-full min-h-[17.5rem] flex-col overflow-hidden rounded-xl border border-border/60 bg-card text-left shadow-sm ring-1 ring-border/30 transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-lg hover:shadow-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-muted">
                    {p.imageUrl ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.imageUrl}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                        <div
                          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-base-100/40 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100"
                          aria-hidden
                        />
                      </>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                        <span className="text-xs font-medium">No image</span>
                      </div>
                    )}
                    {p.isFeatured ? (
                      <span className="absolute right-2 top-2 rounded-full bg-warning px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-warning-foreground shadow-md">
                        Featured
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-1 flex-col p-3.5 sm:p-4">
                    <h3 className="line-clamp-2 min-h-[2.5rem] font-display text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary sm:min-h-[2.75rem] sm:text-[0.9375rem]">
                      {p.name}
                    </h3>

                    <div className="mt-2 space-y-1.5 text-sm">
                      <ProductUnitPrice
                        price={p.price}
                        compareAtPrice={p.compareAtPrice}
                        saleClassName="font-bold text-primary"
                        strikeClassName="text-muted-foreground text-sm"
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

                    <div className="mt-auto flex items-center gap-1.5 border-t border-border/40 pt-2.5 text-xs text-muted-foreground">
                      <Star className="h-3.5 w-3.5 shrink-0 fill-warning text-warning" />
                      <span className="tabular-nums font-medium text-foreground/90">
                        {p.averageRating.toFixed(1)}
                      </span>
                      <span className="text-muted-foreground">·</span>
                      <span>
                        {p.totalOrdersCount.toLocaleString()} orders
                      </span>
                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
