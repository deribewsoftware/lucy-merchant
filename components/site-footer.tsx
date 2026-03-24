import Link from "next/link";
import { brandCopy } from "@/lib/brand/copy";

export function SiteFooter() {
  const link =
    "link link-hover text-sm text-base-content/70 hover:text-base-content";

  return (
    <footer className="border-t border-base-300/80 bg-base-100/90 py-10 backdrop-blur-sm">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-display text-sm font-bold text-base-content">
              {brandCopy.name}
            </p>
            <p className="mt-1 max-w-xs text-xs text-base-content/55">
              {brandCopy.tagline}
            </p>
          </div>
          <nav
            className="flex flex-wrap gap-x-6 gap-y-2"
            aria-label="Site links"
          >
            <Link href="/browse" className={link}>
              Catalog
            </Link>
            <Link href="/companies" className={link}>
              Suppliers
            </Link>
            <Link href="/search" className={link}>
              Search
            </Link>
            <Link href="/login" className={link}>
              Sign in
            </Link>
            <Link href="/register" className={link}>
              Register
            </Link>
          </nav>
        </div>
        <p className="mt-8 text-center text-xs text-base-content/45 sm:text-start">
          © {new Date().getFullYear()} {brandCopy.name}
        </p>
      </div>
    </footer>
  );
}
