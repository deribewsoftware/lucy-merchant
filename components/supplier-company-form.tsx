"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import {
  HiOutlineBuildingOffice2,
  HiOutlineDocumentText,
  HiOutlineMapPin,
  HiOutlineFingerPrint,
  HiOutlineDocumentCheck,
  HiOutlineSparkles,
  HiOutlineShieldCheck,
} from "react-icons/hi2";
import { ClearFieldButton, CompanyDocumentUrlField } from "@/components/company-document-url-field";
import { EthiopianDeliveryLocation } from "@/components/ethiopian-delivery-location";
import { SupplierFormSectionTitle } from "@/components/supplier/form-section";
import {
  supplierFormCardClass,
  supplierGhostButtonClass,
  supplierInputClass,
  supplierLabelClass,
  supplierPrimaryButtonClass,
} from "@/components/supplier/form-styles";
import { isRichTextEmpty } from "@/lib/rich-text";
import { SupplierHeroBackdrop } from "@/components/supplier/supplier-portal-graphics";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

function RegistrationStepsOutline({
  steps,
}: {
  steps: { title: string; hint: string }[];
}) {
  return (
    <ol aria-label="What you will complete" className="mb-8 grid list-none gap-3 sm:grid-cols-3">
      {steps.map((s, i) => (
        <li
          key={s.title}
          className="flex gap-3 rounded-2xl border border-base-300/80 bg-base-200/25 p-4 ring-1 ring-base-300/20"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-sm font-bold tabular-nums text-primary"
            aria-hidden
          >
            {i + 1}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight text-base-content">{s.title}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-base-content/50">{s.hint}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function SupplierCompanyForm({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [licenseDocument, setLicenseDocument] = useState("");
  const [tinNumber, setTinNumber] = useState("");
  const [tradeLicenseNumber, setTradeLicenseNumber] = useState("");
  const [tradeLicenseDocument, setTradeLicenseDocument] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const locationFieldId = useId();
  const licenseFieldId = useId();
  const tradeDocFieldId = useId();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isRichTextEmpty(description)) {
      setMsg("Description is required");
      return;
    }
    setLoading(true);
    setMsg(null);
    const res = await fetch("/api/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        licenseDocument: licenseDocument || undefined,
        businessAddress: businessAddress.trim() || undefined,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        tinNumber: tinNumber.trim() || undefined,
        tradeLicenseNumber: tradeLicenseNumber.trim() || undefined,
        tradeLicenseDocument: tradeLicenseDocument.trim() || undefined,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      company?: { id: string };
    };
    setLoading(false);
    if (!res.ok) {
      setMsg(data.error ?? "Failed");
      return;
    }
    if (data.company?.id) {
      router.push(`/supplier/companies/${data.company.id}`);
      router.refresh();
      return;
    }
    setName("");
    setDescription("");
    setLicenseDocument("");
    setBusinessAddress("");
    setLatitude(null);
    setLongitude(null);
    setTinNumber("");
    setTradeLicenseNumber("");
    setTradeLicenseDocument("");
    router.refresh();
  }

  const shell = (
    <>
      {!embedded ? (
        <div className="border-b border-base-300/70 bg-gradient-to-r from-primary/[0.07] via-transparent to-secondary/[0.06] px-5 py-5 sm:px-8 sm:py-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary shadow-sm ring-1 ring-primary/20">
                <HiOutlineBuildingOffice2 className="h-7 w-7" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary/80">
                  Supplier onboarding
                </p>
                <h2 className="font-display mt-1 text-xl font-bold tracking-tight text-base-content sm:text-2xl">
                  Register a company
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-base-content/70">
                  Complete each block below. An admin will verify your TIN and trade license before you can
                  publish products under this profile.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/[0.08] px-3 py-2.5 sm:max-w-[220px]">
              <HiOutlineShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-[11px] font-medium leading-snug text-base-content/80">
                Identity (Fayda) must already be approved on the Verification page.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <form
        onSubmit={onSubmit}
        className={`${supplierFormCardClass} ${embedded ? "" : "border-0 bg-transparent shadow-none"}`}
      >
          <RegistrationStepsOutline
            steps={[
              { title: "Company profile", hint: "Name & story buyers see" },
              { title: "Legal verification", hint: "TIN & trade license" },
              { title: "Ethiopia location", hint: "Search, woreda & kebele" },
            ]}
          />

          {/* Step 1 — Profile */}
          <section className="rounded-2xl border border-base-300/90 bg-base-100 p-5 shadow-sm sm:p-6">
            <SupplierFormSectionTitle
              icon={<HiOutlineSparkles className="h-5 w-5" />}
              title="1 · Company profile"
              subtitle="Public-facing name and description. You can refine these later."
            />
            <div className="space-y-4">
              <label className={supplierLabelClass}>
                Legal or brand name
                <input
                  required
                  placeholder="As registered or as shown to buyers"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={supplierInputClass}
                />
              </label>
              <label className={supplierLabelClass}>
                <span className="inline-flex items-center gap-1.5 normal-case tracking-normal">
                  <HiOutlineDocumentText className="h-3.5 w-3.5" />
                  Description
                </span>
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="What you supply, regions served, certifications…"
                  variant="supplier"
                  className="mt-1"
                  editorMinHeightClass="min-h-[8rem] sm:min-h-[9rem]"
                  aria-label="Company description"
                />
              </label>
            </div>
          </section>

          {/* Step 2 — Verification docs */}
          <section className="mt-6 rounded-2xl border border-secondary/25 bg-gradient-to-br from-base-100 via-base-100 to-secondary/[0.07] p-5 shadow-sm sm:p-6">
            <SupplierFormSectionTitle
              icon={<HiOutlineDocumentCheck className="h-5 w-5" />}
              title="2 · Business verification"
              subtitle="These details are reviewed by admins. TIN and trade license number are required to submit."
            />

            <div className="mt-2 rounded-xl border border-info/20 bg-info/[0.06] px-4 py-3 text-[12px] leading-relaxed text-base-content/75">
              <strong className="text-base-content/90">Documents:</strong> Upload a file here, paste any HTTPS
              link, or type a short reference. Images and PDFs show an inline preview when possible; use Open if a PDF stays blank.
            </div>

            <div className="mt-6 space-y-8">
              <div>
                <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-base-content/45">
                    Optional · extra license or registration
                  </p>
                  <ClearFieldButton
                    show={licenseDocument.trim().length > 0}
                    onClear={() => setLicenseDocument("")}
                    label="Clear optional license field"
                  />
                </div>
                <CompanyDocumentUrlField
                  id={licenseFieldId}
                  label="Supplementary license / certificate (optional)"
                  description="Upload a scan, paste an HTTPS link, or enter a filing reference."
                  value={licenseDocument}
                  onChange={setLicenseDocument}
                  placeholder="https://… or reference code"
                  inputType="text"
                  enableUpload
                />
              </div>

              <div className="border-t border-base-300/70 pt-6">
                <p className="mb-4 text-[11px] font-semibold uppercase tracking-wide text-secondary">
                  Required for submission
                </p>
                <div className="grid gap-5 lg:grid-cols-2">
                  <label className={supplierLabelClass}>
                    <span className="inline-flex items-center gap-1.5 normal-case tracking-normal">
                      <HiOutlineFingerPrint className="h-3.5 w-3.5" />
                      TIN (Tax Identification Number)
                    </span>
                    <input
                      required
                      placeholder="e.g. 0012345678"
                      value={tinNumber}
                      onChange={(e) => setTinNumber(e.target.value)}
                      className={`${supplierInputClass} font-mono tabular-nums`}
                      inputMode="numeric"
                    />
                    <span className="text-[11px] font-normal normal-case text-base-content/45">
                      Must match your tax records.
                    </span>
                  </label>
                  <label className={supplierLabelClass}>
                    <span className="inline-flex items-center gap-1.5 normal-case tracking-normal">
                      <HiOutlineDocumentCheck className="h-3.5 w-3.5" />
                      Trade license number
                    </span>
                    <input
                      required
                      placeholder="e.g. AA/TL/12345/2024"
                      value={tradeLicenseNumber}
                      onChange={(e) => setTradeLicenseNumber(e.target.value)}
                      className={supplierInputClass}
                    />
                    <span className="text-[11px] font-normal normal-case text-base-content/45">
                      As printed on your trade license.
                    </span>
                  </label>
                </div>

                <div className="mt-6">
                  <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-base-content/45">
                      Strongly recommended · trade license scan
                    </p>
                    <ClearFieldButton
                      show={tradeLicenseDocument.trim().length > 0}
                      onClear={() => setTradeLicenseDocument("")}
                      label="Clear trade license URL"
                    />
                  </div>
                  <CompanyDocumentUrlField
                    id={tradeDocFieldId}
                    label="Trade license document"
                    description="Upload a scan or paste a link to a clear photo or PDF. Admins match this to the numbers above."
                    value={tradeLicenseDocument}
                    onChange={setTradeLicenseDocument}
                    placeholder="https://… or upload a file"
                    inputType="text"
                    enableUpload
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Step 3 — Location */}
          <section className="mt-6 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm sm:p-6">
            <SupplierFormSectionTitle
              icon={<HiOutlineMapPin className="h-5 w-5" />}
              title="3 · Business location (Ethiopia)"
              subtitle="Search places, then refine region, city, woreda, kebele, and street. Optional but recommended."
            />
            <EthiopianDeliveryLocation
              inputId={locationFieldId}
              label="Search &amp; structured address"
              value={businessAddress}
              onChange={setBusinessAddress}
              onCoordinatesChange={(lat, lng) => {
                setLatitude(lat);
                setLongitude(lng);
              }}
              helperText="Type at least two characters to search OpenStreetMap (Ethiopia only). Pick a result to set map coordinates and fill fields — edit freely after."
              variant="supplier"
            />
            {latitude != null &&
            longitude != null &&
            Number.isFinite(latitude) &&
            Number.isFinite(longitude) ? (
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-success/25 bg-success/[0.06] px-4 py-3">
                <p className="text-[12px] text-base-content/75">
                  Map pin saved from your search — buyers can open the location on a map.
                </p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${latitude},${longitude}`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg bg-success/15 px-3 py-1.5 text-xs font-semibold text-success"
                >
                  Preview on Google Maps
                </a>
              </div>
            ) : null}
          </section>

          {msg && (
            <div className="alert alert-error mt-6 text-sm" role="alert">
              {msg}
            </div>
          )}
          <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-base-300/80 pt-6">
            <button type="submit" disabled={loading} className={supplierPrimaryButtonClass}>
              <HiOutlineBuildingOffice2 className="h-4 w-4" />
              {loading ? "Saving…" : "Submit for verification"}
            </button>
            <button
              type="button"
              className={supplierGhostButtonClass}
              onClick={() => {
                setName("");
                setDescription("");
                setLicenseDocument("");
                setBusinessAddress("");
                setLatitude(null);
                setLongitude(null);
                setTinNumber("");
                setTradeLicenseNumber("");
                setTradeLicenseDocument("");
                setMsg(null);
              }}
            >
              Reset form
            </button>
            {embedded ? (
              <Link href="/supplier/companies" className={supplierGhostButtonClass}>
                Back to companies
              </Link>
            ) : null}
          </div>
        </form>
    </>
  );

  if (embedded) {
    return (
      <div className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-1 shadow-md ring-1 ring-base-300/25">
        <div className="rounded-[14px] border border-base-300/50 bg-base-100">{shell}</div>
      </div>
    );
  }

  return (
    <div className="relative mt-8 overflow-hidden rounded-2xl border border-base-300 bg-gradient-to-br from-base-100 via-base-100 to-primary/[0.06] p-1 shadow-md ring-1 ring-base-300/25">
      <SupplierHeroBackdrop />
      <div className="relative rounded-[14px] border border-base-300/60 bg-base-100/95 backdrop-blur-sm">{shell}</div>
    </div>
  );
}
