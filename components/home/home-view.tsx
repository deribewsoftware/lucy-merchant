"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  FiBriefcase,
  FiClock,
  FiShield,
  FiStar,
  FiTrendingUp,
} from "react-icons/fi";
import {
  HiAdjustmentsHorizontal,
  HiChatBubbleLeftRight,
  HiMagnifyingGlass,
  HiReceiptPercent,
  HiShoppingCart,
  HiShieldCheck,
  HiSparkles,
  HiStar,
  HiUserGroup,
} from "react-icons/hi2";
import { B2BHeroGraphic } from "@/components/illustrations/b2b-hero-graphic";
import { GlobalSearch } from "@/components/global-search";
import { FadeIn } from "@/components/motion/fade-in";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { PageHero } from "@/components/ui/page-hero";
import { SectionHeader } from "@/components/ui/section-header";
import { ProductOrderSpecs } from "@/components/product-order-specs";
import { ProductUnitPrice } from "@/components/product-unit-price";
import { brandCopy } from "@/lib/brand/copy";

export type HomeProduct = {
  id: string;
  name: string;
  minOrderQuantity: number;
  maxDeliveryQuantity: number;
  deliveryTime: string;
  availableQuantity: number;
  itemsPerCarton?: number;
  itemsPerRim?: number;
  itemsPerDozen?: number;
  price: number;
  compareAtPrice?: number;
  isFeatured?: boolean;
};

export type HomeCompany = {
  id: string;
  name: string;
  isVerified: boolean;
  ratingAverage: number;
  totalReviews: number;
};

export type HomeCategory = { id: string; name: string };

const featureIcons = {
  search: HiMagnifyingGlass,
  filter: HiAdjustmentsHorizontal,
  cart: HiShoppingCart,
  chat: HiChatBubbleLeftRight,
  shield: HiShieldCheck,
  star: HiStar,
  percent: HiReceiptPercent,
  roles: HiUserGroup,
} as const;

const icons = {
  trending: FiTrendingUp,
  rating: FiStar,
  new: FiClock,
  recommended: HiSparkles,
};

export function HomeView({
  categories,
  trending,
  topRated,
  newest,
  recommended,
  topCompanies,
}: {
  categories: HomeCategory[];
  trending: HomeProduct[];
  topRated: HomeProduct[];
  newest: HomeProduct[];
  recommended: HomeProduct[];
  topCompanies: HomeCompany[];
}) {
  const { hero, sections, trust, features } = brandCopy;

  return (
    <div className="container mx-auto max-w-6xl flex-1 px-4 py-8 sm:py-12">
      <FadeIn>
        <div className="card overflow-hidden border border-base-300 bg-base-100/90 shadow-xl backdrop-blur-sm">
          <div className="card-body gap-8 p-6 sm:p-10 lg:p-12">
            <PageHero
              eyebrow={hero.eyebrow}
              title={hero.headline}
              lead={hero.lead}
              visual={<B2BHeroGraphic />}
            >
              <div className="w-full min-w-full max-w-3xl shrink-0">
                <GlobalSearch variant="hero" />
                <p className="mt-2 text-xs text-base-content/50">
                  Use the dropdowns for search scope and catalog category, then
                  type — matches what you see in the header.
                </p>
              </div>
              <Link href="/browse" className="btn btn-primary sm:btn-lg">
                {hero.ctaPrimary}
              </Link>
              <Link
                href="/companies"
                className="btn btn-outline btn-primary sm:btn-lg"
              >
                Supplier directory
              </Link>
              <Link
                href="/register"
                className="btn btn-outline btn-primary sm:btn-lg"
              >
                {hero.ctaSecondary}
              </Link>
            </PageHero>

            <div className="flex flex-wrap gap-2 border-t border-base-300 pt-6">
              <span className="badge badge-outline badge-lg gap-1 border-primary/30 font-medium">
                <FiShield className="h-3.5 w-3.5" />
                {trust.line1}
              </span>
              <span className="badge badge-outline badge-lg gap-1 border-secondary/30 font-medium">
                <FiBriefcase className="h-3.5 w-3.5" />
                {trust.line2}
              </span>
              <span className="badge badge-outline badge-lg gap-1 border-accent/30 font-medium">
                <FiStar className="h-3.5 w-3.5" />
                {trust.line3}
              </span>
            </div>
          </div>
        </div>
      </FadeIn>

      {categories.length > 0 && (
        <FadeIn delay={0.04} className="mt-12 sm:mt-14">
          <SectionHeader
            eyebrow="Catalog structure"
            title="Shop by category"
            description="Jump straight into the aisle you need — wired to browse filters and search category hits."
            icon={<HiAdjustmentsHorizontal className="h-5 w-5" />}
            action={
              <Link href="/browse" className="btn btn-ghost btn-sm gap-1">
                Full catalog
                <span aria-hidden>→</span>
              </Link>
            }
          />
          <div className="mt-6 flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/browse?category=${encodeURIComponent(c.id)}`}
                className="btn btn-outline btn-accent btn-sm sm:btn-md"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </FadeIn>
      )}

      <FadeIn delay={0.06} className="mt-14 sm:mt-16">
        <SectionHeader
          eyebrow="Platform capabilities"
          title="Everything the marketplace brief called for"
          description="Discovery, trust, negotiation, and settlement — surfaced clearly so buyers and suppliers know what they get."
          icon={<HiShieldCheck className="h-5 w-5" />}
        />
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => {
            const Icon =
              featureIcons[f.icon as keyof typeof featureIcons] ??
              HiMagnifyingGlass;
            return (
              <motion.li
                key={f.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.04, duration: 0.35 }}
              >
                <div className="card h-full border border-base-300 bg-base-100/80 shadow-md transition hover:border-primary/25 hover:shadow-lg">
                  <div className="card-body gap-3 p-5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="font-display text-base font-semibold leading-snug">
                      {f.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-base-content/70">
                      {f.body}
                    </p>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ul>
      </FadeIn>

      <div className="mt-16 space-y-16 sm:mt-20 sm:space-y-20">
        <ProductSection
          eyebrow="Live demand signals"
          title={sections.trending.title}
          description={sections.trending.subtitle}
          items={trending}
          variant="trending"
          delay={0}
        />
        <ProductSection
          eyebrow="Quality that shows up in the numbers"
          title={sections.topRated.title}
          description={sections.topRated.subtitle}
          items={topRated}
          variant="rating"
          delay={0.05}
        />
        <ProductSection
          eyebrow="First-mover advantage"
          title={sections.newest.title}
          description={sections.newest.subtitle}
          items={newest}
          variant="new"
          delay={0.1}
        />
        {recommended.length > 0 && (
          <ProductSection
            eyebrow="Discovery v2"
            title={sections.recommended.title}
            description={sections.recommended.subtitle}
            items={recommended}
            variant="recommended"
            delay={0.12}
          />
        )}
      </div>

      <FadeIn delay={0.12} className="mt-16 sm:mt-20">
        <SectionHeader
          eyebrow="Reputation you can see"
          title={sections.companies.title}
          description={sections.companies.subtitle}
          icon={<FiBriefcase className="h-5 w-5" />}
        />
        <Stagger className="mt-8 grid gap-4 sm:grid-cols-2">
          {topCompanies.map((c) => (
            <StaggerItem key={c.id}>
              <Link
                href={`/companies/${c.id}`}
                className="card block border border-base-300 bg-base-100 shadow-md transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg"
              >
                <div className="card-body p-5 sm:p-6">
                  <h3 className="card-title font-display text-lg">{c.name}</h3>
                  <p className="text-sm text-base-content/70">
                    {c.isVerified ? (
                      <span className="badge badge-success badge-sm">
                        Verified partner
                      </span>
                    ) : (
                      <span className="badge badge-warning badge-sm">
                        In review
                      </span>
                    )}{" "}
                    · {c.ratingAverage.toFixed(1)}★ ({c.totalReviews} reviews)
                  </p>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </FadeIn>
    </div>
  );
}

function ProductSection({
  eyebrow,
  title,
  description,
  items,
  variant,
  delay,
}: {
  eyebrow: string;
  title: string;
  description: string;
  items: HomeProduct[];
  variant: keyof typeof icons;
  delay: number;
}) {
  const Icon = icons[variant];
  return (
    <FadeIn delay={delay}>
      <SectionHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        icon={<Icon className="h-5 w-5" />}
        action={
          <Link href="/browse" className="btn btn-ghost btn-sm gap-1">
            View all
            <span aria-hidden>→</span>
          </Link>
        }
      />
      <Stagger className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((p) => (
          <StaggerItem key={p.id}>
            <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.22 }}>
              <Link
                href={`/products/${p.id}`}
                className="card group h-full border border-base-300 bg-base-100 shadow-md transition hover:border-primary/35 hover:shadow-xl"
              >
                <div className="card-body p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="card-title line-clamp-2 text-base font-semibold leading-snug group-hover:text-primary">
                      {p.name}
                    </h3>
                    {p.isFeatured && (
                      <span className="badge badge-warning badge-sm shrink-0 uppercase">
                        Featured
                      </span>
                    )}
                  </div>
                  <ProductOrderSpecs
                    className="mt-1"
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
                  <p className="pt-1 text-lg">
                    <ProductUnitPrice
                      price={p.price}
                      compareAtPrice={p.compareAtPrice}
                      saleClassName="font-bold text-primary"
                      strikeClassName="text-base-content/45 line-through decoration-base-content/35 text-base font-normal"
                    />
                  </p>
                </div>
              </Link>
            </motion.div>
          </StaggerItem>
        ))}
      </Stagger>
    </FadeIn>
  );
}
