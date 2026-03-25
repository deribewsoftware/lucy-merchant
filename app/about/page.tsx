import type { Metadata } from "next";
import Link from "next/link";
import { HeartHandshake, Mail, Users } from "lucide-react";
import { StaticDocLayout } from "@/components/static-doc-layout";
import { brandCopy } from "@/lib/brand/copy";

export const metadata: Metadata = {
  title: `About us | ${brandCopy.name}`,
  description: `Learn about ${brandCopy.name}, our B2B marketplace mission, and how we connect verified suppliers with merchants.`,
};

export default function AboutPage() {
  return (
    <StaticDocLayout
      breadcrumbLabel="About us"
      eyebrow="Our story"
      title={`About ${brandCopy.name}`}
      lead={`We built ${brandCopy.name} so procurement teams can discover vetted suppliers, compare bulk listings with clear MOQs and pricing, and move from search to order without losing context.`}
      icon={HeartHandshake}
    >
      <section>
        <h2 className="font-display text-base font-bold tracking-tight text-foreground">
          What we do
        </h2>
        <p className="mt-3">
          {brandCopy.name} is a role-based B2B marketplace: merchants browse, cart,
          and track orders; suppliers manage catalogs and fulfillment from a
          dedicated portal; administrators keep listings and companies aligned
          with your trust bar.
        </p>
        <ul className="mt-4 list-inside list-disc space-y-2 marker:text-primary">
          <li>Discovery across products, companies, and categories</li>
          <li>Bulk cart and checkout with quantity rules that match real listings</li>
          <li>Verified supplier profiles and transparent ratings</li>
          <li>Secure sign-in and workspaces tuned to each role</li>
        </ul>
      </section>

      <section>
        <h2 className="font-display text-base font-bold tracking-tight text-foreground">
          Who we serve
        </h2>
        <p className="mt-3">
          Buyers and sourcing teams use us to shorten supplier shortlists. Sellers
          use us to reach serious wholesale demand. We focus on clarity—pricing,
          minimums, and order status—so both sides spend less time on ambiguity.
        </p>
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-border/50 bg-card/40 p-4">
          <Users
            className="mt-0.5 h-5 w-5 shrink-0 text-primary"
            aria-hidden
          />
          <p className="text-muted-foreground">
            Whether you are onboarding your first supplier or scaling across
            categories, the same principles apply: verified identity where it
            matters, and tools that respect how B2B actually buys.
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-display text-base font-bold tracking-tight text-foreground">
          Contact
        </h2>
        <p className="mt-3">
          Questions about partnerships, demos, or enterprise procurement? Reach
          out—we read every message.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href="mailto:hello@lucymerchant.com"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-colors hover:bg-primary/90"
          >
            <Mail className="h-4 w-4" aria-hidden />
            hello@lucymerchant.com
          </a>
          <Link
            href="/faq"
            className="inline-flex items-center justify-center rounded-lg border border-border/60 bg-card/60 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Read the FAQ
          </Link>
        </div>
      </section>
    </StaticDocLayout>
  );
}
