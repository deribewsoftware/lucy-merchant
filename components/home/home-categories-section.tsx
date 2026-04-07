"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Layers } from "lucide-react";
import { PaginatedClientList } from "@/components/paginated-client-list";

export type HomeCategoryChip = { id: string; name: string };

const PAGE_SIZE = 12;

export function HomeCategoriesSection({
  categories,
}: {
  categories: HomeCategoryChip[];
}) {
  if (categories.length === 0) return null;

  return (
    <section className="relative overflow-hidden border-y border-border/30 bg-gradient-to-b from-muted/25 via-background to-muted/15">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.07] to-transparent" />
      <div className="lm-container relative py-14 sm:py-20">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex gap-5">
            <span
              className="font-display text-4xl font-bold leading-none text-border sm:text-5xl"
              aria-hidden
            >
              01
            </span>
            <div className="min-w-0 pt-1">
              <span className="lm-eyebrow">Categories</span>
              <h2 className="lm-heading-section mt-2 text-balance">Shop by category</h2>
              <p className="mt-2 max-w-xl text-pretty text-muted-foreground">
                Browse the catalog by aisle — use the pager below to move through the full taxonomy.
              </p>
            </div>
          </div>
        </div>

        <PaginatedClientList
          items={categories}
          pageSize={PAGE_SIZE}
          resetKey={categories.map((c) => c.id).join(",")}
          summaryClassName="mt-10 text-sm text-muted-foreground"
          summarySuffix="categories"
          barClassName="mt-6"
        >
          {(pageItems) => (
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {pageItems.map((c, i) => (
                <motion.li
                  key={c.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link
                    href={`/browse?category=${encodeURIComponent(c.id)}`}
                    className="group flex items-center gap-3 rounded-2xl border border-border/50 bg-card/90 p-4 shadow-sm ring-1 ring-border/20 backdrop-blur-sm transition-all hover:border-primary/35 hover:bg-primary/[0.06] hover:shadow-md hover:shadow-primary/5"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary ring-1 ring-primary/15">
                      <Layers className="h-5 w-5" strokeWidth={2} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
                        {c.name}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        View products in this aisle
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:text-primary group-hover:opacity-100" />
                  </Link>
                </motion.li>
              ))}
            </ul>
          )}
        </PaginatedClientList>
      </div>
    </section>
  );
}
