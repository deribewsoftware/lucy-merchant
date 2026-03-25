import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, HelpCircle, Mail, Sparkles } from "lucide-react";
import { brandCopy } from "@/lib/brand/copy";

export const metadata: Metadata = {
  title: `FAQ | ${brandCopy.name}`,
  description:
    "Answers about signing up, placing orders, supplier verification, and getting help on the B2B marketplace.",
};

type FaqItem = { q: string; a: string };

const faqSections: { title: string; items: FaqItem[] }[] = [
  {
    title: "Getting started",
    items: [
      {
        q: `What is ${brandCopy.name}?`,
        a: `${brandCopy.name} is a B2B marketplace where verified suppliers list products with clear pricing and minimum order rules, and merchants discover, compare, and order in bulk — with role-based portals for each side.`,
      },
      {
        q: "Who can create an account?",
        a: "Merchants (buyers) and suppliers each register with the role that matches how they use the platform. Admins operate moderation and system tools in a separate admin area.",
      },
      {
        q: "Is there a cost to browse?",
        a: "You can explore the catalog, supplier directory, and search without placing an order. Creating an account unlocks cart, checkout, and portal features tied to your role.",
      },
    ],
  },
  {
    title: "Orders & catalog",
    items: [
      {
        q: "How do minimum order quantities work?",
        a: "Listings can include minimum order quantities (MOQ) and unit specs. Your cart enforces those rules so you always meet supplier requirements before checkout.",
      },
      {
        q: "How are orders fulfilled?",
        a: "After you place an order, it appears in your merchant portal for tracking. Suppliers manage their side from the supplier portal. Exact payment and shipping flows depend on your organization’s setup — use Contact sales for commercial terms.",
      },
      {
        q: "Can I save or revisit products?",
        a: "Use search and browse filters to narrow the catalog, open product detail pages for full specs, and add lines to your cart when signed in as a merchant.",
      },
    ],
  },
  {
    title: "Trust & suppliers",
    items: [
      {
        q: "What does “verified supplier” mean?",
        a: "Verified companies are reviewed and marked in the directory so they surface ahead of unverified profiles. Always review ratings, policies, and listing details before you buy.",
      },
      {
        q: "How do I become a supplier on the marketplace?",
        a: "Register as a supplier, complete your company profile, and add products from the supplier dashboard. Moderation may apply to listings and public content — see your portal for status.",
      },
    ],
  },
  {
    title: "Accounts & support",
    items: [
      {
        q: "I forgot which portal to use.",
        a: "Merchants use the merchant dashboard for carts and orders. Suppliers use the supplier dashboard for catalog and incoming orders. Sign in with the account you created for that role.",
      },
      {
        q: "How do I get help?",
        a: "Email hello@lucymerchant.com or use Contact sales in the footer for procurement and partnership questions. We aim to respond within one business day.",
      },
    ],
  },
];

function FaqDisclosure({ q, a }: FaqItem) {
  return (
    <details className="group border-b border-border/45 last:border-b-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-sm font-semibold text-foreground outline-none transition-colors hover:text-primary [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 pr-2">{q}</span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <p className="pb-4 pl-0 pr-10 text-sm leading-relaxed text-muted-foreground">
        {a}
      </p>
    </details>
  );
}

export default function FaqPage() {
  return (
    <div className="lm-page-wide animate-in fade-in duration-500">
      <nav
        className="flex items-center gap-2 text-sm text-muted-foreground"
        aria-label="Breadcrumb"
      >
        <Link
          href="/"
          className="transition-colors hover:text-foreground"
        >
          Home
        </Link>
        <span aria-hidden>/</span>
        <span className="text-foreground">FAQ</span>
      </nav>

      <header className="relative mt-6 overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card via-primary/5 to-accent/5 p-6 sm:p-8">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-accent/5 blur-2xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />

        <div className="relative flex flex-wrap items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg shadow-primary/20">
            <HelpCircle className="h-7 w-7 text-primary" aria-hidden />
          </div>
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-3 w-3" aria-hidden />
              Help center
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Frequently asked questions
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Quick answers about the marketplace, roles, orders, and how to
              reach us. Open a section below to read more.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-colors hover:bg-primary/90"
              >
                Create account
              </Link>
              <a
                href="mailto:hello@lucymerchant.com"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border/60 bg-card/60 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Mail className="h-4 w-4" aria-hidden />
                Email support
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="mt-10 space-y-8 pb-12">
        {faqSections.map((section) => (
          <section
            key={section.title}
            aria-labelledby={`faq-${section.title.replace(/\s+/g, "-").toLowerCase()}`}
          >
            <h2
              id={`faq-${section.title.replace(/\s+/g, "-").toLowerCase()}`}
              className="font-display text-lg font-bold tracking-tight text-foreground"
            >
              {section.title}
            </h2>
            <div className="mt-4 rounded-2xl border border-border/50 bg-card/40 px-4 sm:px-6">
              {section.items.map((item) => (
                <FaqDisclosure key={item.q} {...item} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
