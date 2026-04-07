"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Building2,
  ChevronRight,
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
import { HomeCategoriesSection } from "@/components/home/home-categories-section";

export type HomeProduct = {
  id: string;
  name: string;
  minOrderQuantity: number;
  maxDeliveryQuantity?: number;
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
    span: "sm:col-span-1" as const,
  },
  {
    icon: Shield,
    title: "Verified Suppliers",
    description: "Every supplier is vetted and verified for quality assurance and reliability.",
    span: "sm:col-span-1" as const,
  },
  {
    icon: ShoppingCart,
    title: "Bulk Ordering",
    description: "Streamlined procurement with quantity-based pricing and MOQ support.",
    span: "sm:col-span-1" as const,
  },
  {
    icon: MessageSquare,
    title: "Real-time Chat",
    description: "Direct communication with suppliers for negotiations and order updates.",
    span: "sm:col-span-1" as const,
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track orders, spending, and supplier performance in real-time.",
    span: "sm:col-span-2" as const,
  },
  {
    icon: Zap,
    title: "Fast Delivery",
    description: "Optimized logistics with transparent lead times and tracking.",
    span: "sm:col-span-2" as const,
  },
];

const stats = [
  { value: "500+", label: "Verified Suppliers", icon: Building2 },
  { value: "10K+", label: "Products Listed", icon: Package },
  { value: "50K+", label: "Orders Completed", icon: ShoppingCart },
  { value: "99.5%", label: "Satisfaction Rate", icon: Star },
];

function headlineParts() {
  const raw = brandCopy.hero.headline;
  const parts = raw.split(". ");
  if (parts.length >= 3) {
    const last = parts[parts.length - 1] ?? raw;
    const rest = parts.slice(0, -1).map((p) => `${p}.`);
    return { lines: rest, accent: last.endsWith(".") ? last : `${last}.` };
  }
  return { lines: [] as string[], accent: raw };
}

export function HomeView({
  categories,
  trending,
  topRated,
  newest,
  recommended,
  topCompanies,
  merchantCommissionHold = false,
  supplierCommissionHold = false,
}: {
  categories: HomeCategory[];
  trending: HomeProduct[];
  topRated: HomeProduct[];
  newest: HomeProduct[];
  recommended: HomeProduct[];
  topCompanies: HomeCompany[];
  merchantCommissionHold?: boolean;
  supplierCommissionHold?: boolean;
}) {
  const { lines, accent } = headlineParts();

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/35">
        <div className="pointer-events-none absolute inset-0 lm-hero-bg" />
        <div className="pointer-events-none absolute inset-0 lm-grid-pattern opacity-60" />
        <div className="pointer-events-none absolute -right-32 top-1/4 h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-[100px]" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-accent/10 blur-[80px]" />

        <div className="lm-container relative py-14 sm:py-20 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
              >
                <span className="lm-eyebrow inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  {brandCopy.hero.eyebrow}
                </span>
              </motion.div>

              <motion.div
                className="mt-8"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.06 }}
              >
                <h1 className="font-display text-[clamp(2rem,4.2vw+0.5rem,3.35rem)] font-bold leading-[1.08] tracking-[-0.03em] text-foreground">
                  {lines.map((line) => (
                    <span key={line} className="block text-balance">
                      {line}
                    </span>
                  ))}
                  <span className="mt-1 block text-balance lm-gradient-text">
                    {accent}
                  </span>
                </h1>
              </motion.div>

              <motion.p
                className="lm-body-lead mt-6 max-w-xl text-pretty"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.12 }}
              >
                {brandCopy.hero.lead}
              </motion.p>

              <motion.div
                className="mt-8 max-w-xl"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.18 }}
              >
                <GlobalSearch
                  variant="hero"
                  merchantCommissionHold={merchantCommissionHold}
                  supplierCommissionHold={supplierCommissionHold}
                />
              </motion.div>

              <motion.div
                className="mt-8 flex flex-wrap items-center gap-3"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.24 }}
              >
                <Link
                  href="/browse"
                  className="lm-btn lm-btn-primary group h-12 rounded-xl px-7 text-sm font-semibold"
                >
                  {brandCopy.hero.ctaPrimary}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/companies"
                  className="lm-btn lm-btn-outline h-12 rounded-xl border-border/80 bg-card/40 px-6 text-sm font-semibold backdrop-blur-sm"
                >
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  View suppliers
                </Link>
                <Link
                  href="/register"
                  className="lm-btn lm-btn-ghost h-12 rounded-xl px-5 text-sm font-semibold text-muted-foreground hover:text-foreground"
                >
                  {brandCopy.hero.ctaSecondary}
                  <ChevronRight className="h-4 w-4 opacity-70" />
                </Link>
              </motion.div>

              <motion.div
                className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-border/35 pt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.32 }}
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/15 text-success">
                    <Shield className="h-4 w-4" />
                  </span>
                  {brandCopy.trust.line1}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <BadgeCheck className="h-4 w-4" />
                  </span>
                  {brandCopy.trust.line2}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/15 text-warning">
                    <Star className="h-4 w-4" />
                  </span>
                  {brandCopy.trust.line3}
                </div>
              </motion.div>
            </div>

            <HeroVisualPanel />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative border-b border-border/35 bg-gradient-to-b from-card/80 to-background">
        <div className="lm-container py-10 sm:py-12">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-0 sm:divide-x sm:divide-border/40">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="flex flex-col items-center px-2 text-center sm:px-6"
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.06 }}
              >
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <stat.icon className="h-5 w-5" />
                </span>
                <p className="font-display text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
                  {stat.value}
                </p>
                <p className="mt-1 max-w-[11rem] text-xs leading-snug text-muted-foreground sm:text-sm">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <HomeCategoriesSection categories={categories} />

      {/* Features — bento */}
      <section className="border-y border-border/35 bg-muted/20">
        <div className="lm-container py-14 sm:py-20">
          <SectionHeader
            index="02"
            eyebrow="Platform"
            title="Built for serious B2B workflows"
            description="From first search to delivered goods — one coherent stack for buyers and suppliers."
          />
          <div className="mt-12 grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                className={`group relative overflow-hidden rounded-2xl border border-border/45 bg-card/90 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 ${feature.span}`}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-24px" }}
                transition={{ delay: i * 0.06 }}
              >
                <div
                  className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 blur-2xl transition-opacity group-hover:opacity-100"
                  aria-hidden
                />
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-info/10 text-primary ring-1 ring-primary/20 transition-transform duration-300 group-hover:scale-105">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold tracking-tight text-foreground">
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

      {/* Product rails */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border/35 to-transparent" />
        <div className="lm-container space-y-20 py-16 sm:space-y-24 sm:py-24">
          <ProductSection
            sectionIndex="03"
            eyebrow="Trending Now"
            title={brandCopy.sections.trending.title}
            description={brandCopy.sections.trending.subtitle}
            icon={TrendingUp}
            items={trending}
          />
          <ProductSection
            sectionIndex="04"
            eyebrow="Top Rated"
            title={brandCopy.sections.topRated.title}
            description={brandCopy.sections.topRated.subtitle}
            icon={Star}
            items={topRated}
          />
          <ProductSection
            sectionIndex="05"
            eyebrow="Just Added"
            title={brandCopy.sections.newest.title}
            description={brandCopy.sections.newest.subtitle}
            icon={Clock}
            items={newest}
          />
          {recommended.length > 0 && (
            <ProductSection
              sectionIndex="06"
              eyebrow="Recommended"
              title={brandCopy.sections.recommended.title}
              description={brandCopy.sections.recommended.subtitle}
              icon={Sparkles}
              items={recommended}
            />
          )}
        </div>
      </div>

      {/* Companies */}
      <section className="border-t border-border/35 bg-gradient-to-b from-muted/15 to-background">
        <div className="lm-container py-14 sm:py-20">
          <SectionHeader
            index="07"
            eyebrow="Verified partners"
            title={brandCopy.sections.companies.title}
            description={brandCopy.sections.companies.subtitle}
            action={
              <Link
                href="/companies"
                className="group inline-flex items-center gap-2 rounded-full border border-border/45 bg-card/60 px-4 py-2 text-sm font-medium text-primary transition-colors hover:border-primary/35 hover:bg-primary/10"
              >
                View all suppliers
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            }
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {topCompanies.map((company, i) => (
              <motion.div
                key={company.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Link
                  href={`/companies/${company.id}`}
                  className="group relative flex items-start gap-4 overflow-hidden rounded-2xl border border-border/45 bg-card/80 p-5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                >
                  <span
                    className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-gradient-to-b from-primary to-accent opacity-80"
                    aria-hidden
                  />
                  <div className="ml-2 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/25 via-card to-accent/20 text-lg font-bold text-primary ring-1 ring-border/45">
                    {company.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-display text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
                        {company.name}
                      </h3>
                      {company.isVerified && (
                        <BadgeCheck className="h-5 w-5 shrink-0 text-success" />
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-warning" />
                        {company.ratingAverage.toFixed(1)}
                      </span>
                      <span>{company.totalReviews} reviews</span>
                    </div>
                  </div>
                  <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="lm-container pb-16 pt-4 sm:pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/[0.12] via-card to-accent/[0.08] p-8 sm:p-12 lg:p-16">
          <div className="pointer-events-none absolute inset-0 lm-grid-pattern opacity-40" />
          <div className="pointer-events-none absolute -right-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-primary/20 blur-[90px]" />
          <div className="relative mx-auto max-w-2xl text-center">
            <span className="lm-eyebrow">{brandCopy.tagline}</span>
            <h2 className="lm-heading-section mt-4 text-balance">
              Ready to run procurement on one trusted surface?
            </h2>
            <p className="lm-body-lead mt-4 text-pretty">
              Join teams using {brandCopy.name} to discover suppliers, align on terms in chat, and
              close bulk orders without friction.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/register"
                className="lm-btn lm-btn-primary group h-12 rounded-xl px-8 text-sm font-semibold"
              >
                Get started free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/browse"
                className="lm-btn lm-btn-outline h-12 rounded-xl border-border/80 bg-background/40 px-7 text-sm font-semibold backdrop-blur-sm"
              >
                <Package className="h-4 w-4" />
                Explore catalog
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function HeroVisualPanel() {
  return (
    <motion.div
      className="relative hidden lg:block"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.55, delay: 0.15 }}
    >
      <div className="relative mx-auto max-w-md">
        <motion.div
          className="absolute -left-6 top-8 z-10 rounded-2xl border border-border/80 bg-card/95 p-4 shadow-xl shadow-black/20 backdrop-blur-md"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="flex items-center gap-3">
            <span className="lm-pulse-dot shrink-0" />
            <div>
              <p className="text-xs font-medium text-foreground">Live marketplace</p>
              <p className="text-xs text-muted-foreground">New SKUs indexed continuously</p>
            </div>
          </div>
        </motion.div>

        <div className="relative rounded-3xl border border-border/45 bg-card/60 p-6 shadow-2xl shadow-black/25 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-border/35 pb-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Sample pipeline
              </p>
              <p className="mt-1 font-display text-lg font-semibold text-foreground">
                Wholesale order
              </p>
            </div>
            <span className="rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent">
              In progress
            </span>
          </div>
          <ul className="mt-5 space-y-3">
            {["Search & compare", "Cart validated to MOQ", "Supplier chat & confirm"].map(
              (step, idx) => (
                <li
                  key={step}
                  className="flex items-center gap-3 rounded-xl border border-border/40 bg-background/40 px-3 py-2.5 text-sm"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-xs font-bold text-primary">
                    {idx + 1}
                  </span>
                  <span className="text-foreground">{step}</span>
                  {idx < 2 && (
                    <CheckMini className="ml-auto h-4 w-4 text-success" />
                  )}
                </li>
              ),
            )}
          </ul>
          <div className="mt-6 flex gap-2 rounded-xl bg-muted/40 p-3">
            {[40, 65, 45, 80, 55, 90].map((h, i) => (
              <div
                key={i}
                className="flex flex-1 flex-col justify-end rounded-md bg-gradient-to-t from-primary/40 to-primary/10"
                style={{ height: `${h}px` }}
              />
            ))}
          </div>
        </div>

        <motion.div
          className="absolute -bottom-4 -right-4 z-10 max-w-[220px] rounded-2xl border border-border/80 bg-card/95 p-4 shadow-xl backdrop-blur-md"
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="h-4 w-4 text-info" />
            <span>Roles: merchant · supplier · admin</span>
          </div>
          <p className="mt-2 text-sm font-medium text-foreground">
            Everyone sees the workflow that matches their job.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

function CheckMini({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M3.5 8.5L6.5 11.5L12.5 4.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SectionHeader({
  index,
  eyebrow,
  title,
  description,
  action,
}: {
  index?: string;
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex gap-5">
        {index && (
          <span
            className="font-display text-4xl font-bold leading-none text-border sm:text-5xl"
            aria-hidden
          >
            {index}
          </span>
        )}
        <div className={index ? "min-w-0 pt-1" : ""}>
          <span className="lm-eyebrow">{eyebrow}</span>
          <h2 className="lm-heading-section mt-2 text-balance">{title}</h2>
          <p className="mt-2 max-w-xl text-pretty text-muted-foreground">{description}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

function ProductSection({
  sectionIndex,
  eyebrow,
  title,
  description,
  icon: Icon,
  items,
}: {
  sectionIndex?: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: typeof TrendingUp;
  items: HomeProduct[];
}) {
  return (
    <section>
      <SectionHeader
        index={sectionIndex}
        eyebrow={eyebrow}
        title={title}
        description={description}
        action={
          <Link
            href="/browse"
            className="group inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/85"
          >
            <Icon className="h-4 w-4 opacity-70" />
            View all
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        }
      />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-32px" }}
            transition={{ delay: i * 0.06 }}
          >
            <Link
              href={`/products/${product.id}`}
              className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/45 bg-card/80 p-5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
            >
              <span
                className="absolute inset-x-0 top-0 h-0.5 scale-x-0 bg-gradient-to-r from-primary via-info to-accent transition-transform duration-300 group-hover:scale-x-100"
                aria-hidden
              />
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-2 font-display text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
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
              <div className="mt-auto border-t border-border/35 pt-4">
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
