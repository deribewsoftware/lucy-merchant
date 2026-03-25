import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

type Props = {
  breadcrumbLabel: string;
  eyebrow: string;
  title: string;
  lead: string;
  icon: LucideIcon;
  children: React.ReactNode;
};

export function StaticDocLayout({
  breadcrumbLabel,
  eyebrow,
  title,
  lead,
  icon: Icon,
  children,
}: Props) {
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
        <span className="text-foreground">{breadcrumbLabel}</span>
      </nav>

      <header className="relative mt-6 overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card via-primary/5 to-accent/5 p-6 sm:p-8">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-accent/5 blur-2xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />

        <div className="relative flex flex-wrap items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg shadow-primary/20">
            <Icon className="h-7 w-7 text-primary" aria-hidden />
          </div>
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-3 w-3" aria-hidden />
              {eyebrow}
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {lead}
            </p>
          </div>
        </div>
      </header>

      <article className="mx-auto mt-10 max-w-3xl space-y-8 pb-12 text-sm leading-relaxed text-muted-foreground">
        {children}
      </article>
    </div>
  );
}
