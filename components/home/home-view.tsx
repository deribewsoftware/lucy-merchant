"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Building2,
  Clock,
  MessageSquare,
  Package,
  Search,
  Shield,
  ShoppingCart,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { GlobalSearch } from "@/components/global-search";
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

const features = [
  {
    icon: Search,
    title: "Smart Discovery",
    description: "Find products with intelligent search and advanced filtering across categories.",
  },
  {
    icon: Shield,
    title: "Verified Suppliers",
    description: "Every supplier is vetted and verified for quality assurance and reliability.",
  },
  {
    icon: ShoppingCart,
    title: "Bulk Ordering",
    description: "Streamlined procurement with quantity-based pricing and MOQ support.",
  },
  {
    icon: MessageSquare,
    title: "Real-time Chat",
    description: "Direct communication with suppliers for negotiations and order updates.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track orders, spending, and supplier performance in real-time.",
  },
  {
    icon: Zap,
    title: "Fast Delivery",
    description: "Optimized logistics with transparent lead times and tracking.",
  },
];

const stats = [
  { value: "500+", label: "Verified Suppliers" },
  { value: "10K+", label: "Products Listed" },
  { value: "50K+", label: "Orders Completed" },
  { value: "99.5%", label: "Satisfaction Rate" },
];

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
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden lm-hero-bg">
        <div className="absolute inset-0 lm-grid-pattern" />
        <div className="lm-container relative py-16 sm:py-24 lg:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="lm-eyebrow inline-flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {brandCopy.hero.eyebrow}
              </span>
            </motion.div>

            <motion.h1
              className="lm-heading-display mt-6 text-balance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {brandCopy.hero.headline}
            </motion.h1>

            <motion.p
              className="lm-body-lead mx-auto mt-6 max-w-2xl text-pretty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {brandCopy.hero.lead}
            </motion.p>

            {/* Search Box */}
            <motion.div
              className="mx-auto mt-10 max-w-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <GlobalSearch variant="hero" />
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              className="mt-8 flex flex-wrap items-center justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Link
                href="/browse"
                className="group flex h-12 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
              >
                {brandCopy.hero.ctaPrimary}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/companies"
                className="flex h-12 items-center gap-2 rounded-lg border border-border bg-card/50 px-6 text-sm font-semibold text-foreground transition-all hover:border-primary/30 hover:bg-card"
              >
                <Building2 className="h-4 w-4" />
                View Suppliers
              </Link>
              <Link
                href="/register"
                className="flex h-12 items-center gap-2 rounded-lg border border-border bg-card/50 px-6 text-sm font-semibold text-foreground transition-all hover:border-primary/30 hover:bg-card"
              >
                {brandCopy.hero.ctaSecondary}
              </Link>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              className="mt-12 flex flex-wrap items-center justify-center gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 text-success" />
                {brandCopy.trust.line1}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BadgeCheck className="h-4 w-4 text-primary" />
                {brandCopy.trust.line2}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Star className="h-4 w-4 text-warning" />
                {brandCopy.trust.line3}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border bg-card/50">
        <div className="lm-container py-12">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <p className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="lm-container py-16 sm:py-20">
          <SectionHeader
            eyebrow="Categories"
            title="Shop by Category"
            description="Browse our curated collection of wholesale categories"
          />
          <div className="mt-8 flex flex-wrap gap-3">
            {categories.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/browse?category=${encodeURIComponent(c.id)}`}
                  className="inline-flex h-10 items-center rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                >
                  {c.name}
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="border-t border-border bg-card/30">
        <div className="lm-container py-16 sm:py-20">
          <SectionHeader
            eyebrow="Platform Features"
            title="Everything You Need to Scale"
            description="Built for modern B2B commerce with enterprise-grade features"
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                className="lm-card lm-card-hover group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Sections */}
      <div className="lm-container space-y-16 py-16 sm:space-y-20 sm:py-20">
        <ProductSection
          eyebrow="Trending Now"
          title={brandCopy.sections.trending.title}
          description={brandCopy.sections.trending.subtitle}
          icon={TrendingUp}
          items={trending}
        />
        <ProductSection
          eyebrow="Top Rated"
          title={brandCopy.sections.topRated.title}
          description={brandCopy.sections.topRated.subtitle}
          icon={Star}
          items={topRated}
        />
        <ProductSection
          eyebrow="Just Added"
          title={brandCopy.sections.newest.title}
          description={brandCopy.sections.newest.subtitle}
          icon={Clock}
          items={newest}
        />
        {recommended.length > 0 && (
          <ProductSection
            eyebrow="Recommended"
            title={brandCopy.sections.recommended.title}
            description={brandCopy.sections.recommended.subtitle}
            icon={Sparkles}
            items={recommended}
          />
        )}
      </div>

      {/* Top Companies Section */}
      <section className="border-t border-border bg-card/30">
        <div className="lm-container py-16 sm:py-20">
          <SectionHeader
            eyebrow="Verified Partners"
            title={brandCopy.sections.companies.title}
            description={brandCopy.sections.companies.subtitle}
            action={
              <Link
                href="/companies"
                className="group flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                View all suppliers
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            }
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {topCompanies.map((company, i) => (
              <motion.div
                key={company.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  href={`/companies/${company.id}`}
                  className="lm-card lm-card-interactive flex items-start gap-4"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 text-lg font-bold text-primary">
                    {company.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-display text-lg font-semibold text-foreground">
                        {company.name}
                      </h3>
                      {company.isVerified && (
                        <BadgeCheck className="h-5 w-5 shrink-0 text-success" />
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-warning" />
                        {company.ratingAverage.toFixed(1)}
                      </span>
                      <span>{company.totalReviews} reviews</span>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="lm-container py-16 sm:py-20">
        <div className="lm-card relative overflow-hidden bg-gradient-to-br from-primary/10 via-card to-accent/10 p-8 sm:p-12 lg:p-16">
          <div className="absolute inset-0 lm-grid-pattern opacity-50" />
          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="lm-heading-section text-balance">
              Ready to Transform Your Procurement?
            </h2>
            <p className="lm-body-lead mt-4 text-pretty">
              Join thousands of businesses using Lucy Merchant to streamline their wholesale operations.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/register"
                className="group flex h-12 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/browse"
                className="flex h-12 items-center gap-2 rounded-lg border border-border bg-card/80 px-6 text-sm font-semibold text-foreground transition-all hover:border-primary/30"
              >
                <Package className="h-4 w-4" />
                Explore Catalog
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <span className="lm-eyebrow">{eyebrow}</span>
        <h2 className="lm-heading-section mt-2 text-balance">{title}</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

function ProductSection({
  eyebrow,
  title,
  description,
  icon: Icon,
  items,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: typeof TrendingUp;
  items: HomeProduct[];
}) {
  return (
    <section>
      <SectionHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        action={
          <Link
            href="/browse"
            className="group flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            View all
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        }
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <Link
              href={`/products/${product.id}`}
              className="lm-card lm-card-interactive group flex h-full flex-col"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-2 font-display text-base font-semibold text-foreground transition-colors group-hover:text-primary">
                  {product.name}
                </h3>
                {product.isFeatured && (
                  <span className="shrink-0 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
                    Featured
                  </span>
                )}
              </div>
              <div className="mt-3">
                <ProductOrderSpecs
                  size="sm"
                  product={{
                    minOrderQuantity: product.minOrderQuantity,
                    maxDeliveryQuantity: product.maxDeliveryQuantity,
                    deliveryTime: product.deliveryTime,
                    availableQuantity: product.availableQuantity,
                    itemsPerCarton: product.itemsPerCarton,
                    itemsPerRim: product.itemsPerRim,
                    itemsPerDozen: product.itemsPerDozen,
                  }}
                />
              </div>
              <div className="mt-auto pt-4">
                <ProductUnitPrice
                  price={product.price}
                  compareAtPrice={product.compareAtPrice}
                  saleClassName="text-lg font-bold text-primary"
                  strikeClassName="text-sm text-muted-foreground line-through"
                />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
