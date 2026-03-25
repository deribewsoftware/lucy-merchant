import type { SVGProps } from "react";
import Link from "next/link";
import {
  Sparkles,
  Mail,
  MapPin,
  ShieldCheck,
  MessageSquare,
  Lock,
} from "lucide-react";
import { brandCopy } from "@/lib/brand/copy";

function LinkedInGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function GitHubGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

const discoverLinks = [
  { label: "Browse catalog", href: "/browse" },
  { label: "Verified suppliers", href: "/companies" },
  { label: "Search products", href: "/search" },
  { label: "About us", href: "/about" },
  { label: "FAQ", href: "/faq" },
];

const accountLinks = [
  { label: "Sign in", href: "/login" },
  { label: "Create account", href: "/register" },
  { label: "Merchant portal", href: "/merchant/dashboard" },
  { label: "Supplier portal", href: "/supplier/dashboard" },
];

const legalLinks = [
  { label: "Privacy policy", href: "/privacy" },
  { label: "Terms of service", href: "/terms" },
];

const trustItems = [
  { icon: Lock, text: brandCopy.trust.line1 },
  { icon: ShieldCheck, text: brandCopy.trust.line2 },
  { icon: MessageSquare, text: brandCopy.trust.line3 },
] as const;

const socialLinks = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com",
    Icon: LinkedInGlyph,
  },
  {
    label: "GitHub",
    href: "https://github.com",
    Icon: GitHubGlyph,
  },
] as const;

function FooterWave() {
  return (
    <svg
      className="absolute inset-x-0 top-0 h-12 w-full -translate-y-[99%] text-base-300/50 sm:h-16"
      viewBox="0 0 1440 48"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        fill="currentColor"
        fillOpacity="0.35"
        d="M0 48V20c120 18 240 18 360 6s240-30 360-30 240 18 360 30 240 6 360-6v28H0z"
      />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative mt-auto border-t border-base-300/50 bg-base-100">
      <FooterWave />

      <div
        className="pointer-events-none absolute -top-32 left-[10%] h-56 w-56 rounded-full bg-primary/15 blur-3xl sm:left-[20%]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 right-[-10%] h-64 w-64 rounded-full bg-secondary/10 blur-3xl sm:right-[5%]"
        aria-hidden
      />

      <div className="relative lm-container py-12 sm:py-14 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10 xl:gap-14">
          {/* Brand + trust + social */}
          <div className="flex flex-col gap-8 lg:col-span-5">
            <div>
              <Link
                href="/"
                className="group inline-flex items-center gap-3 rounded-xl outline-none ring-offset-2 ring-offset-base-100 transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/75 shadow-lg shadow-primary/25 ring-1 ring-white/10">
                  <Sparkles
                    className="h-5 w-5 text-primary-content"
                    aria-hidden
                  />
                </div>
                <div className="text-left">
                  <span className="font-display text-lg font-bold tracking-tight text-base-content sm:text-xl">
                    {brandCopy.name}
                  </span>
                  <p className="text-xs text-base-content/60 sm:text-sm">
                    {brandCopy.tagline}
                  </p>
                </div>
              </Link>
              <p className="mt-5 max-w-md text-pretty text-sm leading-relaxed text-base-content/70 sm:text-[0.9375rem]">
                A modern B2B marketplace for verified suppliers and merchants —
                bulk ordering, clear pricing, and secure role-based access.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {trustItems.map(({ icon: Icon, text }) => (
                <span
                  key={text}
                  className="inline-flex items-center gap-1.5 rounded-full border border-base-300/80 bg-base-200/40 px-3 py-1.5 text-xs font-medium text-base-content/80 backdrop-blur-sm"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                  {text}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4 border-t border-base-300/40 pt-6">
              <a
                href="mailto:hello@lucymerchant.com"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-content shadow-md shadow-primary/20 transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100"
              >
                <Mail className="h-4 w-4 shrink-0" aria-hidden />
                Contact sales
              </a>
              <div className="flex items-center gap-1.5 text-sm text-base-content/65">
                <MapPin className="h-4 w-4 shrink-0 text-primary/80" aria-hidden />
                <span>San Francisco, CA</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="sr-only">Social</span>
              {socialLinks.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-base-300/70 bg-base-200/30 text-base-content/70 transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100"
                  aria-label={label}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns — 2 cols on small phones, 3 from sm+ */}
          <nav
            className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:col-span-7 lg:gap-x-8"
            aria-label="Footer"
          >
            <div>
              <h2 className="font-display text-xs font-semibold uppercase tracking-[0.12em] text-base-content">
                Discover
              </h2>
              <ul className="mt-4 space-y-2.5">
                {discoverLinks.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-base-content/65 transition hover:text-primary hover:underline hover:underline-offset-4"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="font-display text-xs font-semibold uppercase tracking-[0.12em] text-base-content">
                Account
              </h2>
              <ul className="mt-4 space-y-2.5">
                {accountLinks.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-base-content/65 transition hover:text-primary hover:underline hover:underline-offset-4"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <h2 className="font-display text-xs font-semibold uppercase tracking-[0.12em] text-base-content">
                Legal
              </h2>
              <ul className="mt-4 space-y-2.5">
                {legalLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-base-content/65 transition hover:text-primary hover:underline hover:underline-offset-4"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <a
                    href="mailto:hello@lucymerchant.com"
                    className="text-sm text-base-content/65 transition hover:text-primary hover:underline hover:underline-offset-4"
                  >
                    hello@lucymerchant.com
                  </a>
                </li>
              </ul>
            </div>
          </nav>
        </div>
      </div>

      <div className="relative border-t border-base-300/50 bg-base-200/20">
        <div className="lm-container flex flex-col items-center justify-between gap-3 py-5 sm:flex-row sm:gap-4 sm:py-6">
          <p className="text-center text-xs text-base-content/55 sm:text-left sm:text-sm">
            © {new Date().getFullYear()} {brandCopy.name}. All rights reserved.
          </p>
          <p className="text-center text-xs text-base-content/45 sm:text-right">
            Built for wholesale & procurement teams
          </p>
        </div>
      </div>
    </footer>
  );
}
