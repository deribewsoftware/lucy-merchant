"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import {
  HiOutlineBuildingOffice2,
  HiOutlineDocumentText,
  HiOutlineMapPin,
  HiOutlinePencilSquare,
  HiOutlinePhoto,
  HiOutlineFingerPrint,
  HiOutlineDocumentCheck,
} from "react-icons/hi2";
import { companyApprovedOrVerified, type Company } from "@/lib/domain/types";
import { CompanyDocumentUrlField } from "@/components/company-document-url-field";
import { EthiopianDeliveryLocation } from "@/components/ethiopian-delivery-location";
import { SupplierFormSectionTitle } from "@/components/supplier/form-section";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  supplierFormCardClass,
  supplierGhostButtonClass,
  supplierInputClass,
  supplierLabelClass,
  supplierPrimaryButtonClass,
} from "@/components/supplier/form-styles";
import { isRichTextEmpty } from "@/lib/rich-text";
import { ETHIOPIAN_BANK_NAMES_FOR_SUPPLIER } from "@/lib/data/ethiopian-banks";

const CUSTOM_BANK_VALUE = "__custom__";

export function SupplierCompanyEditForm({
  company,
  mode = "inline",
}: {
  company: Company;
  /** `page` = full-page manage (no toggle). `inline` = collapsible under list cards. */
  mode?: "inline" | "page";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(mode === "page");
  const [name, setName] = useState(company.name);
  const [description, setDescription] = useState(company.description);
  const [licenseDocument, setLicenseDocument] = useState(
    company.licenseDocument ?? "",
  );
  const [logo, setLogo] = useState(company.logo ?? "");
  const [businessAddress, setBusinessAddress] = useState(
    company.businessAddress ?? "",
  );
  const [latitude, setLatitude] = useState<number | null>(
    company.latitude ?? null,
  );
  const [longitude, setLongitude] = useState<number | null>(
    company.longitude ?? null,
  );
  const [settlementBankName, setSettlementBankName] = useState(
    company.settlementBankName ?? "",
  );
  const [settlementAccountName, setSettlementAccountName] = useState(
    company.settlementAccountName ?? "",
  );
  const [settlementAccountNumber, setSettlementAccountNumber] = useState(
    company.settlementAccountNumber ?? "",
  );
  const [tinNumber, setTinNumber] = useState(company.tinNumber ?? "");
  const [tradeLicenseNumber, setTradeLicenseNumber] = useState(
    company.tradeLicenseNumber ?? "",
  );
  const [tradeLicenseDoc, setTradeLicenseDoc] = useState(
    company.tradeLicenseDocument ?? "",
  );
  const [bankCustomMode, setBankCustomMode] = useState(() => {
    const n = (company.settlementBankName ?? "").trim();
    return Boolean(n && !ETHIOPIAN_BANK_NAMES_FOR_SUPPLIER.includes(n));
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const locationFieldId = useId();
  const locked = companyApprovedOrVerified(company);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isRichTextEmpty(description)) {
      setMsg("Description is required");
      return;
    }
    setLoading(true);
    setMsg(null);
    const res = await fetch(`/api/companies/${company.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        licenseDocument: licenseDocument.trim() || "",
        logo: logo.trim() || "",
        businessAddress: businessAddress.trim(),
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        settlementBankName: settlementBankName.trim(),
        settlementAccountName: settlementAccountName.trim(),
        settlementAccountNumber: settlementAccountNumber.trim(),
        tinNumber: tinNumber.trim(),
        tradeLicenseNumber: tradeLicenseNumber.trim(),
        tradeLicenseDocument: tradeLicenseDoc.trim(),
      }),
      credentials: "same-origin",
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMsg(data.error ?? "Failed to update");
      return;
    }
    if (mode === "inline") {
      setOpen(false);
    }
    router.refresh();
  }

  if (locked) {
    return (
      <div
        className={
          mode === "page"
            ? supplierFormCardClass
            : "mt-4 border-t border-base-300 pt-4"
        }
      >
        <p className="mb-4 rounded-lg bg-success/10 px-3 py-2 text-sm leading-relaxed text-base-content/80 ring-1 ring-success/20">
          <span className="flex items-start gap-2">
            <HiOutlineBuildingOffice2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <span>
              This company is verified. Profile details, documents, and bank fields are locked so buyers
              see a stable record. Remove every product listing for this company first (
              <Link
                href="/supplier/products"
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                open listings
              </Link>
              ); then you can remove the company below if you no longer need it.
            </span>
          </span>
        </p>
      </div>
    );
  }

  const formBody = (
        <form onSubmit={onSubmit} className={supplierFormCardClass}>
          <p className="mb-4 flex items-center gap-2 rounded-lg bg-base-200/60 px-3 py-2 text-xs text-base-content/70">
            <HiOutlineBuildingOffice2 className="h-4 w-4 shrink-0 text-base-content/50" />
            Verification status is managed by admins only.
          </p>
          <SupplierFormSectionTitle
            icon={<HiOutlineDocumentText className="h-5 w-5" />}
            title="Company details"
          />
          <div className="space-y-4">
            <label className={supplierLabelClass}>
              Name
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={supplierInputClass}
              />
            </label>
            <label className={supplierLabelClass}>
              Description
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="What you supply, regions, certifications…"
                variant="supplier"
                className="mt-1"
                editorMinHeightClass="min-h-[7rem] sm:min-h-[8rem]"
                aria-label="Company description"
              />
            </label>
            <CompanyDocumentUrlField
              label="Supplementary license / certificate (optional)"
              description="Upload, paste an HTTPS link, or enter a short reference."
              value={licenseDocument}
              onChange={setLicenseDocument}
              placeholder="https://… or reference code"
              inputType="text"
              enableUpload
            />
            <label className={supplierLabelClass}>
              <span className="inline-flex items-center gap-1.5 normal-case tracking-normal">
                <HiOutlinePhoto className="h-3.5 w-3.5" />
                Logo image URL (https)
              </span>
              <input
                type="url"
                placeholder="https://…"
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                className={supplierInputClass}
              />
            </label>
          </div>

          <div className="mt-6 rounded-2xl border border-secondary/25 bg-gradient-to-br from-base-100 via-base-100 to-secondary/[0.06] p-4 sm:p-5">
            <SupplierFormSectionTitle
              icon={<HiOutlineDocumentCheck className="h-5 w-5" />}
              title="Business verification documents"
              subtitle="TIN and trade license numbers are checked against your uploaded link when you provide one."
            />
            <p className="mb-4 rounded-lg border border-info/15 bg-info/[0.06] px-3 py-2 text-[11px] leading-relaxed text-base-content/70">
              Images and PDFs preview below when the link allows it. For external PDFs, use Open if the preview is blank.
            </p>
            <div className="space-y-4">
              <label className={supplierLabelClass}>
                <span className="inline-flex items-center gap-1.5 normal-case tracking-normal">
                  <HiOutlineFingerPrint className="h-3.5 w-3.5" />
                  TIN Number (Tax Identification)
                </span>
                <input
                  placeholder="e.g. 0012345678"
                  value={tinNumber}
                  onChange={(e) => setTinNumber(e.target.value)}
                  className={`${supplierInputClass} font-mono tabular-nums`}
                  inputMode="numeric"
                />
              </label>
              <label className={supplierLabelClass}>
                <span className="inline-flex items-center gap-1.5 normal-case tracking-normal">
                  <HiOutlineDocumentCheck className="h-3.5 w-3.5" />
                  Trade License Number
                </span>
                <input
                  placeholder="e.g. AA/TL/12345/2024"
                  value={tradeLicenseNumber}
                  onChange={(e) => setTradeLicenseNumber(e.target.value)}
                  className={supplierInputClass}
                />
              </label>
              <CompanyDocumentUrlField
                label="Trade license document"
                description="Upload a scan or paste a link — admins use this together with the numbers above."
                value={tradeLicenseDoc}
                onChange={setTradeLicenseDoc}
                placeholder="https://… or upload"
                inputType="text"
                enableUpload
              />
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-base-300 bg-gradient-to-br from-base-100 to-primary/[0.04] p-4">
            <SupplierFormSectionTitle
              icon={<HiOutlineBuildingOffice2 className="h-5 w-5" />}
              title="Buyer payments (Ethiopian banks)"
              subtitle="Merchants pay you by bank transfer or COD. Pick your bank and account — same institutions as CBE, Awash, Dashen, Telebirr, etc."
            />
            <div className="mt-3 space-y-3">
              <label className={supplierLabelClass}>
                Bank
                <select
                  className={`${supplierInputClass} cursor-pointer`}
                  value={(() => {
                    const t = settlementBankName.trim();
                    if (bankCustomMode) return CUSTOM_BANK_VALUE;
                    if (!t) return "";
                    return ETHIOPIAN_BANK_NAMES_FOR_SUPPLIER.includes(t)
                      ? t
                      : CUSTOM_BANK_VALUE;
                  })()}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === CUSTOM_BANK_VALUE) {
                      setBankCustomMode(true);
                      setSettlementBankName("");
                    } else if (v === "") {
                      setBankCustomMode(false);
                      setSettlementBankName("");
                    } else {
                      setBankCustomMode(false);
                      setSettlementBankName(v);
                    }
                  }}
                >
                  <option value="">Select bank…</option>
                  {ETHIOPIAN_BANK_NAMES_FOR_SUPPLIER.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                  <option value={CUSTOM_BANK_VALUE}>Other — type name</option>
                </select>
              </label>
              {(() => {
                const t = settlementBankName.trim();
                const showCustom =
                  bankCustomMode ||
                  (Boolean(t) &&
                    !ETHIOPIAN_BANK_NAMES_FOR_SUPPLIER.includes(t));
                return showCustom;
              })() ? (
                <label className={supplierLabelClass}>
                  Bank name
                  <input
                    value={settlementBankName}
                    onChange={(e) => {
                      setSettlementBankName(e.target.value);
                      setBankCustomMode(true);
                    }}
                    className={supplierInputClass}
                    placeholder="e.g. Regional or cooperative bank"
                  />
                </label>
              ) : null}
              <label className={supplierLabelClass}>
                Account name (as on bank book)
                <input
                  value={settlementAccountName}
                  onChange={(e) => setSettlementAccountName(e.target.value)}
                  className={supplierInputClass}
                  placeholder="Business or account holder name"
                />
              </label>
              <label className={supplierLabelClass}>
                Account number
                <input
                  value={settlementAccountNumber}
                  onChange={(e) => setSettlementAccountNumber(e.target.value)}
                  className={`${supplierInputClass} font-mono tabular-nums`}
                  placeholder="Digits for transfer"
                  inputMode="numeric"
                  autoComplete="off"
                />
              </label>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-base-300 p-4 sm:p-5">
            <SupplierFormSectionTitle
              icon={<HiOutlineMapPin className="h-5 w-5" />}
              title="Address in Ethiopia"
              subtitle="Search places, set region / woreda / kebele, or clear to remove from your public profile."
            />
            <EthiopianDeliveryLocation
              key={mode === "page" ? company.id : `${company.id}-${open}`}
              inputId={locationFieldId}
              label="Search &amp; structured address"
              initialAddress={company.businessAddress ?? ""}
              value={businessAddress}
              onChange={setBusinessAddress}
              onCoordinatesChange={(lat, lng) => {
                setLatitude(lat);
                setLongitude(lng);
              }}
              helperText="Pick a search result to refresh coordinates, or edit the fields by hand."
              variant="supplier"
            />
            {latitude != null &&
            longitude != null &&
            Number.isFinite(latitude) &&
            Number.isFinite(longitude) ? (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${latitude},${longitude}`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/[0.06] px-3 py-2 text-xs font-semibold text-primary"
              >
                Open saved pin in Google Maps
              </a>
            ) : null}
          </div>

          {msg && (
            <p className="alert alert-error mt-4 text-sm">
              {msg}
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={loading}
              className={supplierPrimaryButtonClass}
            >
              {loading ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() =>
                mode === "page" ? router.push("/supplier/companies") : setOpen(false)
              }
              className={supplierGhostButtonClass}
            >
              {mode === "page" ? "Back to list" : "Cancel"}
            </button>
          </div>
        </form>
  );

  if (mode === "page") {
    return formBody;
  }

  return (
    <div className="mt-4 border-t border-base-300 pt-4">
      {!open ? (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setName(company.name);
            setDescription(company.description);
            setLicenseDocument(company.licenseDocument ?? "");
            setLogo(company.logo ?? "");
            setBusinessAddress(company.businessAddress ?? "");
            setLatitude(company.latitude ?? null);
            setLongitude(company.longitude ?? null);
            const bn = company.settlementBankName ?? "";
            setSettlementBankName(bn);
            setBankCustomMode(
              Boolean(bn.trim() && !ETHIOPIAN_BANK_NAMES_FOR_SUPPLIER.includes(bn.trim())),
            );
            setSettlementAccountName(company.settlementAccountName ?? "");
            setSettlementAccountNumber(company.settlementAccountNumber ?? "");
            setTinNumber(company.tinNumber ?? "");
            setTradeLicenseNumber(company.tradeLicenseNumber ?? "");
            setTradeLicenseDoc(company.tradeLicenseDocument ?? "");
            setMsg(null);
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-800 transition hover:bg-violet-100 dark:border-violet-500/30 dark:bg-violet-950/40 dark:text-violet-200 dark:hover:bg-violet-950/60"
        >
          <HiOutlinePencilSquare className="h-4 w-4" />
          Edit profile
        </button>
      ) : (
        formBody
      )}
    </div>
  );
}
