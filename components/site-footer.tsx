import Link from "next/link";
import { Sparkles, Mail, MapPin, Phone, ArrowUpRight } from "lucide-react";
import { brandCopy } from "@/lib/brand/copy";

const footerLinks = {
  marketplace: [
    { label: "Browse Catalog", href: "/browse" },
    { label: "Verified Suppliers", href: "/companies" },
    { label: "Search Products", href: "/search" },
    { label: "Categories", href: "/browse" },
  ],
  account: [
    { label: "Sign In", href: "/login" },
    { label: "Create Account", href: "/register" },
    { label: "Merchant Portal", href: "/merchant/dashboard" },
    { label: "Supplier Portal", href: "/supplier/dashboard" },
  ],
  company: [
    { label: "About Us", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
};

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      {/* Main Footer */}
      <div className="lm-container py-12 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-5 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <span className="font-display text-xl font-bold text-foreground">
                  {brandCopy.name}
                </span>
                <p className="text-xs text-muted-foreground">{brandCopy.tagline}</p>
              </div>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              The modern B2B marketplace connecting verified suppliers with merchants worldwide. 
              Streamlined bulk ordering, real-time communication, and secure transactions.
            </p>
            
            {/* Contact Info */}
            <div className="mt-6 space-y-3">
              <a 
                href="mailto:hello@lucymerchant.com" 
                className="flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                <Mail className="h-4 w-4" />
                hello@lucymerchant.com
              </a>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                San Francisco, CA
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                +1 (555) 123-4567
              </div>
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">
              Marketplace
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.marketplace.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 transition-all group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">
              Account
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.account.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 transition-all group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">
              Company
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 transition-all group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="lm-container flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} {brandCopy.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-sm text-muted-foreground transition-colors hover:text-primary">
              Privacy
            </Link>
            <Link href="#" className="text-sm text-muted-foreground transition-colors hover:text-primary">
              Terms
            </Link>
            <Link href="#" className="text-sm text-muted-foreground transition-colors hover:text-primary">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
