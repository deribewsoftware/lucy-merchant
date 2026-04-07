import Link from "next/link";
import { notFound } from "next/navigation";
import {
  HiOutlineArrowLeft,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineBuildingOffice2,
  HiOutlineClock,
  HiOutlineMapPin,
  HiOutlineShieldCheck,
  HiOutlineUserCircle,
} from "react-icons/hi2";
import { AdminCompanyDocumentReadonly } from "@/components/admin-company-document-readonly";
import { AdminCompanyVerifyActions } from "@/components/admin-company-verify-actions";
import { RichTextContent } from "@/components/rich-text-content";
import { companyApprovedOrVerified, type VerificationStatus } from "@/lib/domain/types";
import { getCompanySettlementAccounts } from "@/lib/domain/company-settlement-accounts";
import { getCategories, getCompany, listProducts } from "@/lib/db/catalog";
import { findUserById } from "@/lib/db/users";
import { isRichTextEmpty } from "@/lib/rich-text";
import { requireStaffPagePermission } from "@/lib/server/require-staff-page";

type Params = { params: Promise<{ id: string }> };

function verificationLabel(v: VerificationStatus | undefined): string {
  switch (v) {
    case "none":
      return "None";
    case "pending":
      return "Pending review";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    default:
      return "—";
  }
}

export default async function AdminCompanyDetailPage({ params }: Params) {
  const { id } = await params;
  await requireStaffPagePermission("companies:verify", `/admin/companies/${id}`);

  const company = getCompany(id);
  if (!company) notFound();

  const owner = findUserById(company.ownerId);
  const categories = getCategories();
  const catById = new Map(categories.map((c) => [c.id, c.name]));
  const accounts = getCompanySettlementAccounts(company);
  const productCount = listProducts().filter((p) => p.companyId === id).length;
  const locked = companyApprovedOrVerified(company);
  const rejected = company.verificationStatus === "rejected";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 border-b border-base-300 pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link
            href="/admin/companies"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <HiOutlineArrowLeft className="h-4 w-4" />
            Company verification queue
          </Link>
          <div className="mt-4 flex flex-wrap items-start gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <HiOutlineBuildingOffice2 className="h-7 w-7" />
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-base-content">
                {company.name}
              </h1>
              <p className="mt-1 font-mono text-xs text-base-content/45">ID {company.id}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {locked ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success ring-1 ring-success/25">
                    <HiOutlineShieldCheck className="h-4 w-4" />
                    Verified (marketplace)
                  </span>
                ) : rejected ? (
                  <span className="rounded-full bg-error/15 px-3 py-1 text-xs font-semibold text-error ring-1 ring-error/20">
                    Declined — supplier may resubmit
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-3 py-1 text-xs font-semibold text-warning ring-1 ring-warning/25">
                    <HiOutlineClock className="h-4 w-4" />
                    Pending verification
                  </span>
                )}
                <span className="text-xs text-base-content/50">
                  Workflow: {verificationLabel(company.verificationStatus)}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-3 sm:items-end">
          <AdminCompanyVerifyActions
            companyId={company.id}
            companyName={company.name}
            showVerificationActions={!company.isVerified}
            className="w-full sm:w-auto sm:min-w-[12rem]"
          />
          <Link
            href={`/companies/${company.id}`}
            className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 hover:underline sm:justify-end"
          >
            Open public profile
            <HiOutlineArrowTopRightOnSquare className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {rejected && company.rejectionReason?.trim() ? (
        <div className="rounded-2xl border border-error/25 bg-error/5 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-error/80">
            Last decline reason
          </p>
          <p className="mt-1 text-sm text-base-content/85">{company.rejectionReason.trim()}</p>
        </div>
      ) : null}

      <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm ring-1 ring-base-300/20 sm:p-6">
        <h2 className="font-semibold text-base-content">Supplier account</h2>
        <div className="mt-4 flex flex-wrap gap-4">
          <div className="flex min-w-0 items-start gap-2">
            <HiOutlineUserCircle className="mt-0.5 h-5 w-5 shrink-0 text-base-content/40" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-base-content/45">
                Owner
              </p>
              <p className="mt-0.5 font-medium text-base-content">{owner?.name ?? "—"}</p>
              <p className="mt-1 font-mono text-xs text-base-content/55">{owner?.email ?? company.ownerId}</p>
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-base-content/45">
              Products listed
            </p>
            <p className="mt-0.5 text-sm font-medium text-base-content">{productCount}</p>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-base-content/45">
              Created
            </p>
            <p className="mt-0.5 text-sm text-base-content/80">
              {new Date(company.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm ring-1 ring-base-300/20 sm:p-6">
        <h2 className="font-semibold text-base-content">Description</h2>
        <p className="mt-1 text-xs text-base-content/50">
          Full rich text as submitted — same as buyers will see after verification.
        </p>
        <div className="mt-4">
          {isRichTextEmpty(company.description) ? (
            <p className="text-sm text-base-content/55">No description provided.</p>
          ) : (
            <RichTextContent html={company.description} variant="baseMuted" />
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm ring-1 ring-base-300/20 sm:p-6">
        <h2 className="font-semibold text-base-content">Branding</h2>
        <div className="mt-4 space-y-4">
          {company.logo?.trim() ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-base-content/45">
                Logo URL
              </p>
              <a
                href={company.logo.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 break-all text-sm font-medium text-primary underline-offset-2 hover:underline"
              >
                {company.logo.trim()}
              </a>
              {/* eslint-disable-next-line @next/next/no-img-element -- admin review */}
              <img
                src={company.logo.trim()}
                alt=""
                className="mt-3 max-h-40 rounded-xl border border-base-300 object-contain"
              />
            </div>
          ) : (
            <p className="text-sm text-base-content/55">No logo URL.</p>
          )}
        </div>
      </section>

      {(company.recommendationCategoryIds ?? []).length > 0 ? (
        <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm ring-1 ring-base-300/20 sm:p-6">
          <h2 className="font-semibold text-base-content">Trade focus (categories)</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {(company.recommendationCategoryIds ?? []).map((cid) => (
              <li
                key={cid}
                className="rounded-full bg-secondary/10 px-3 py-1 text-sm font-medium text-secondary"
              >
                {catById.get(cid) ?? cid}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm ring-1 ring-base-300/20 sm:p-6">
        <h2 className="font-semibold text-base-content">Business verification (TIN &amp; license)</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-base-content/45">
              TIN number
            </p>
            <p className="mt-1 font-mono text-sm text-base-content">
              {company.tinNumber?.trim() || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-base-content/45">
              Trade license number
            </p>
            <p className="mt-1 font-mono text-sm text-base-content">
              {company.tradeLicenseNumber?.trim() || "—"}
            </p>
          </div>
        </div>
        <div className="mt-6 space-y-6">
          <AdminCompanyDocumentReadonly
            label="Trade license document"
            value={company.tradeLicenseDocument ?? ""}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm ring-1 ring-base-300/20 sm:p-6">
        <h2 className="font-semibold text-base-content">Supplementary license / certificate</h2>
        <div className="mt-4">
          <AdminCompanyDocumentReadonly
            label="Optional document"
            value={company.licenseDocument ?? ""}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm ring-1 ring-base-300/20 sm:p-6">
        <h2 className="font-semibold text-base-content">Settlement bank accounts</h2>
        <p className="mt-1 text-xs text-base-content/50">
          Accounts buyers may see at checkout for bank transfer.
        </p>
        {accounts.length === 0 ? (
          <p className="mt-4 text-sm text-base-content/55">No bank accounts on file.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {accounts.map((a, i) => (
              <li
                key={a.id}
                className="rounded-xl border border-base-300/80 bg-base-200/20 px-4 py-3"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-base-content/45">
                  Account {i + 1}
                </p>
                <p className="mt-2 text-sm text-base-content">
                  <span className="text-base-content/55">Bank: </span>
                  {a.bankName || "—"}
                </p>
                <p className="mt-1 text-sm text-base-content">
                  <span className="text-base-content/55">Name: </span>
                  {a.accountName || "—"}
                </p>
                <p className="mt-1 font-mono text-sm text-base-content">
                  <span className="font-sans text-base-content/55">No.: </span>
                  {a.accountNumber || "—"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm ring-1 ring-base-300/20 sm:p-6">
        <h2 className="font-semibold text-base-content">Address &amp; location</h2>
        {company.businessAddress?.trim() ? (
          <p className="mt-4 flex items-start gap-2 text-sm text-base-content/80">
            <HiOutlineMapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            {company.businessAddress.trim()}
          </p>
        ) : (
          <p className="mt-4 text-sm text-base-content/55">No address on file.</p>
        )}
        {company.latitude != null &&
        company.longitude != null &&
        Number.isFinite(company.latitude) &&
        Number.isFinite(company.longitude) ? (
          <div className="mt-4 space-y-2">
            <p className="font-mono text-xs text-base-content/60">
              {company.latitude.toFixed(6)}, {company.longitude.toFixed(6)}
            </p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `${company.latitude},${company.longitude}`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/[0.06] px-3 py-2 text-xs font-semibold text-primary"
            >
              Open pin in Google Maps
              <HiOutlineArrowTopRightOnSquare className="h-3.5 w-3.5" />
            </a>
          </div>
        ) : null}
      </section>
    </div>
  );
}
