"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  HiOutlineArrowRight,
  HiOutlineBuildingOffice2,
  HiOutlineDocumentText,
  HiOutlineMapPin,
  HiOutlineMagnifyingGlass,
  HiOutlinePhoto,
  HiOutlineShieldCheck,
} from "react-icons/hi2";
import { SupplierDeleteCompanyButton } from "@/components/supplier-delete-company-button";
import { PaginationBar, PaginationSummary } from "@/components/ui/pagination-bar";
import { stripHtmlToPlainText } from "@/lib/rich-text";
import { companyApprovedOrVerified, type Company } from "@/lib/domain/types";
import { isLikelyPublicImageUrl } from "@/lib/utils/document-url";
import { clampPage, pageStartIndex } from "@/lib/utils/pagination";

const DIRECTORY_PAGE_SIZE = 8;

function DocLinkPill({
  label,
  url,
}: {
  label: string;
  url: string;
}) {
  const t = url.trim();
  if (!t) return null;
  const img = isLikelyPublicImageUrl(t);
  const isHttp = /^https?:\/\//i.test(t);
  const isPath = t.startsWith("/api/uploads/") || t.startsWith("/uploads/");
  const href = isHttp || isPath ? t : undefined;
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-base-300/80 bg-base-200/30 p-2.5 sm:flex-row sm:items-center sm:gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {img ? <HiOutlinePhoto className="h-4 w-4" /> : <HiOutlineDocumentText className="h-4 w-4" />}
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-base-content/45">{label}</p>
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-xs font-medium text-primary hover:underline"
            >
              {img ? "View image" : "Open document"}
            </a>
          ) : (
            <p className="truncate font-mono text-[11px] text-base-content/70">{t}</p>
          )}
        </div>
      </div>
      {img && href ? (
        <div className="relative h-14 w-full shrink-0 overflow-hidden rounded-lg border border-base-300/60 bg-base-100 sm:h-16 sm:w-24">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={href} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}
    </div>
  );
}

export function SupplierCompaniesBoard({
  companies,
  productCountByCompanyId = {},
}: {
  companies: Company[];
  productCountByCompanyId?: Record<string, number>;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) => {
      const hay = [
        c.name,
        stripHtmlToPlainText(c.description),
        c.businessAddress ?? "",
        c.tinNumber ?? "",
        c.tradeLicenseNumber ?? "",
        c.licenseDocument ?? "",
        c.tradeLicenseDocument ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [companies, query]);

  const total = filtered.length;
  const safePage = clampPage(page, total, DIRECTORY_PAGE_SIZE);
  const start = pageStartIndex(safePage, total, DIRECTORY_PAGE_SIZE);
  const pageRows = filtered.slice(start, start + DIRECTORY_PAGE_SIZE);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-base-content sm:text-xl">Directory</h2>
          <p className="mt-1 text-sm text-base-content/60">
            Search and open a company to manage it. Verified organizations have a locked profile; remove
            all listings first if you need to delete one.
          </p>
        </div>
        <label className="relative w-full sm:max-w-md">
          <span className="sr-only">Search companies</span>
          <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-base-content/40" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, address, TIN…"
            className="w-full rounded-2xl border border-base-300 bg-base-100 py-2.5 pl-10 pr-4 text-sm text-base-content shadow-sm outline-none ring-1 ring-base-300/20 transition placeholder:text-base-content/40 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
      </div>

      {companies.length > 0 && filtered.length > 0 ? (
        <>
          <PaginationSummary
            page={safePage}
            pageSize={DIRECTORY_PAGE_SIZE}
            total={total}
            className="text-sm text-base-content/60"
          />
          <ul className="mt-4 space-y-5">
            {pageRows.map((c) => (
            <li
              key={c.id}
              className="group overflow-hidden rounded-2xl border border-base-300/90 bg-base-100 shadow-md ring-1 ring-base-300/20 transition hover:ring-primary/20"
            >
              <div className="relative border-b border-base-300 bg-gradient-to-r from-primary/[0.07] via-base-200/40 to-secondary/[0.06] px-5 py-4 sm:px-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-base-100 text-primary shadow-sm ring-1 ring-base-300/50 transition group-hover:bg-primary/10">
                      <HiOutlineBuildingOffice2 className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-base-content">{c.name}</p>
                      <p className="mt-0.5 text-[11px] text-base-content/45">
                        ID <span className="font-mono text-base-content/55">{c.id}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {c.verificationStatus === "approved" || c.isVerified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success ring-1 ring-success/20">
                        <HiOutlineShieldCheck className="h-3.5 w-3.5" />
                        Verified
                      </span>
                    ) : c.verificationStatus === "rejected" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-error/15 px-3 py-1 text-xs font-semibold text-error ring-1 ring-error/20">
                        Declined
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-3 py-1 text-xs font-semibold text-warning ring-1 ring-warning/25">
                        Pending verification
                      </span>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/supplier/companies/${c.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-content shadow-md shadow-primary/20 transition hover:bg-primary/90 sm:text-sm"
                      >
                        Manage
                        <HiOutlineArrowRight className="h-4 w-4" />
                      </Link>
                      <SupplierDeleteCompanyButton
                        companyId={c.id}
                        name={c.name}
                        productCount={productCountByCompanyId[c.id] ?? 0}
                        companyVerified={companyApprovedOrVerified(c)}
                        variant="inline"
                        navigateToListAfterDelete={false}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 px-5 py-5 sm:px-6">
                <p className="line-clamp-3 text-sm leading-relaxed text-base-content/80">
                  {stripHtmlToPlainText(c.description)}
                </p>

                {c.businessAddress?.trim() ? (
                  <div className="flex gap-2 rounded-xl border border-base-300/60 bg-base-200/25 px-3 py-2.5">
                    <HiOutlineMapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <p className="text-sm leading-snug text-base-content/75">{c.businessAddress.trim()}</p>
                  </div>
                ) : null}

                {(c.tinNumber || c.tradeLicenseNumber) && (
                  <div className="flex flex-wrap gap-2">
                    {c.tinNumber ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-secondary/10 px-2.5 py-1 text-xs font-medium text-secondary">
                        TIN{" "}
                        <span className="font-mono text-base-content/85">{c.tinNumber}</span>
                      </span>
                    ) : null}
                    {c.tradeLicenseNumber ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
                        License{" "}
                        <span className="font-mono text-base-content/85">{c.tradeLicenseNumber}</span>
                      </span>
                    ) : null}
                  </div>
                )}

                {(c.licenseDocument?.trim() || c.tradeLicenseDocument?.trim()) && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {c.licenseDocument?.trim() ? (
                      <DocLinkPill label="Extra license / cert" url={c.licenseDocument.trim()} />
                    ) : null}
                    {c.tradeLicenseDocument?.trim() ? (
                      <DocLinkPill label="Trade license file" url={c.tradeLicenseDocument.trim()} />
                    ) : null}
                  </div>
                )}

                {c.verificationStatus === "rejected" && c.rejectionReason ? (
                  <div className="rounded-xl border border-error/25 bg-error/5 px-3 py-2.5">
                    <p className="text-xs font-semibold text-error/80">Decline reason</p>
                    <p className="mt-1 text-xs leading-relaxed text-base-content/75">{c.rejectionReason}</p>
                  </div>
                ) : null}
              </div>
            </li>
            ))}
          </ul>
          <PaginationBar
            page={safePage}
            pageSize={DIRECTORY_PAGE_SIZE}
            total={total}
            onPageChange={setPage}
            className="mt-4 justify-start"
          />
        </>
      ) : (
        <ul className="space-y-5">
          {companies.length === 0 ? (
            <li className="relative overflow-hidden rounded-2xl border border-dashed border-primary/30 bg-gradient-to-br from-primary/[0.04] to-base-100 px-6 py-14 text-center">
              <HiOutlineBuildingOffice2 className="mx-auto h-12 w-12 text-primary/40" />
              <p className="mt-4 text-base font-semibold text-base-content">No companies yet</p>
              <p className="mt-2 text-sm text-base-content/60">
                Register your first brand or legal entity to start listing products.
              </p>
              <Link
                href="/supplier/companies/new"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-content shadow-md shadow-primary/20 transition hover:bg-primary/90"
              >
                Register new company
                <HiOutlineArrowRight className="h-4 w-4" />
              </Link>
            </li>
          ) : (
            <li className="rounded-2xl border border-base-300 bg-base-100 px-6 py-10 text-center text-sm text-base-content/65">
              No matches for &ldquo;{query.trim()}&rdquo;. Try a shorter search.
            </li>
          )}
        </ul>
      )}
    </section>
  );
}
