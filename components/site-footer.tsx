"use client";

import type { ReactNode, SVGProps } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Mail,
  MapPin,
  ShieldCheck,
  MessageSquare,
  Lock,
} from "lucide-react";
import { LucyMerchantMarkBadge } from "@/components/brand/lucy-merchant-mark";
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
  { label: "Suppliers", href: "/companies" },
  { label: "Search", href: "/search" },
  { label: "About", href: "/about" },
  { label: "FAQ", href: "/faq" },
] as const;

const accountLinks = [
  { label: "Sign in", href: "/login" },
  { label: "Register", href: "/register" },
  { label: "Merchant", href: "/merchant/dashboard" },
] as const;

const legalLinks = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
] as const;

const trustItems = [
  { icon: Lock, text: brandCopy.trust.line1 },
  { icon: ShieldCheck, text: brandCopy.trust.line2 },
  { icon: MessageSquare, text: brandCopy.trust.line3 },
] as const;

const socialLinks = [
  { label: "LinkedIn", href: "https://www.linkedin.com", Icon: LinkedInGlyph },
  { label: "GitHub", href: "https://github.com", Icon: GitHubGlyph },
] as const;

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block py-0.5 text-[13px] leading-snug text-base-content/70 transition-colors hover:text-primary"
    >
      {children}
    </Link>
  );
}

export function SiteFooter() {
  const pathname = usePathname();
  const isAuthRoute = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/change-password"].some(
    (r) => pathname === r || pathname.startsWith(`${r}/`)
  );

  if (isAuthRoute) return null;

  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-auto border-t border-base-300/40 bg-gradient-to-b from-base-100 via-base-100 to-base-200/35">
      {/* Accent line */}
      <div
        className="h-px w-full bg-gradient-to-r from-transparent via-primary/35 to-transparent"
        aria-hidden
      />

      <div className="relative lm-container py-7 sm:py-8 md:py-9">
        <div className="grid gap-7 sm:gap-8 lg:grid-cols-12 lg:gap-6 xl:gap-8">
          {/* Brand block — compact */}
          <div className="lg:col-span-4">
            <Link
              href="/"
              className="group inline-flex max-w-full items-start gap-2.5 rounded-lg outline-none ring-offset-2 ring-offset-base-100 transition hover:opacity-[0.97] focus-visible:ring-2 focus-visible:ring-primary/50 sm:gap-3"
            >
              <LucyMerchantMarkBadge
                badgeSize="md"
                markSize="md"
                className="ring-white/10 transition group-hover:shadow-md group-hover:shadow-primary/20"
              />
              <div className="min-w-0 pt-0.5 text-left">
                <span className="font-display text-base font-bold tracking-tight text-base-content sm:text-[1.05rem]">
                  {brandCopy.name}
                </span>
                <p className="mt-0.5 text-[11px] leading-snug text-base-content/55 sm:text-xs">
                  {brandCopy.tagline}
                </p>
              </div>
            </Link>
            <p className="mt-3 max-w-sm text-pretty text-[13px] leading-relaxed text-base-content/60">
              B2B marketplace for verified suppliers and merchants — bulk orders,
              clear pricing, secure access.
            </p>

            {/* Trust — dense inline row */}
            <ul className="mt-3 flex flex-wrap gap-x-2.5 gap-y-1.5 text-[11px] text-base-content/55">
              {trustItems.map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="inline-flex max-w-full items-center gap-1 rounded-md border border-base-300/50 bg-base-200/25 px-2 py-0.5"
                >
                  <Icon
                    className="h-3 w-3 shrink-0 text-primary/90"
                    aria-hidden
                  />
                  <span className="leading-tight">{text}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <a
                href="mailto:hello@lucymerchant.com"
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-content shadow-sm shadow-primary/15 transition hover:bg-primary/92 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-base-100"
              >
                <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Contact
              </a>
              <span className="inline-flex items-center gap-1 text-[12px] text-base-content/55">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/70" aria-hidden />
                San Francisco, CA
              </span>
            </div>
          </div>

          {/* Link grid — tight columns */}
          <nav
            className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 lg:col-span-8 lg:gap-x-8"
            aria-label="Footer"
          >
            <div>
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-base-content/45">
                Discover
              </h2>
              <ul className="mt-2 space-y-1">
                {discoverLinks.map((link) => (
                  <li key={link.href}>
                    <FooterLink href={link.href}>{link.label}</FooterLink>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-base-content/45">
                Account
              </h2>
              <ul className="mt-2 space-y-1">
                {accountLinks.map((link) => (
                  <li key={link.href}>
                    <FooterLink href={link.href}>{link.label}</FooterLink>
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-base-content/45">
                Legal
              </h2>
              <ul className="mt-2 space-y-1">
                {legalLinks.map((link) => (
                  <li key={link.href}>
                    <FooterLink href={link.href}>{link.label}</FooterLink>
                  </li>
                ))}
                <li>
                  <a
                    href="mailto:hello@lucymerchant.com"
                    className="block py-0.5 text-[13px] leading-snug text-base-content/70 transition-colors hover:text-primary"
                  >
                    hello@lucymerchant.com
                  </a>
                </li>
              </ul>
            </div>
          </nav>
        </div>
      </div>

      {/* Bar — single compact strip */}
      <div className="border-t border-base-300/40 bg-base-200/30">
        <div className="lm-container flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-3">
          <p className="text-center text-[11px] text-base-content/50 sm:text-left sm:text-xs">
            © {year} {brandCopy.name}. All rights reserved.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-5">
            <p className="text-center text-[11px] text-base-content/40 sm:text-right sm:text-xs">
              Wholesale & procurement
            </p>
            <div className="flex items-center justify-center gap-1.5">
              <span className="sr-only">Social</span>
              {socialLinks.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-base-300/55 bg-base-100/50 text-base-content/60 transition hover:border-primary/35 hover:bg-primary/8 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                  aria-label={label}
                >
                  <Icon className="h-[15px] w-[15px]" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
