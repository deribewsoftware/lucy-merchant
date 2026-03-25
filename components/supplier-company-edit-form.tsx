"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import {
  HiOutlineBuildingOffice2,
  HiOutlineDocumentText,
  HiOutlineMapPin,
  HiOutlinePencilSquare,
  HiOutlinePhoto,
} from "react-icons/hi2";
import type { Company } from "@/lib/domain/types";
import { GoogleLocationPicker } from "@/components/google-location-picker";
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

export function SupplierCompanyEditForm({ company }: { company: Company }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
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
  const [bankCustomMode, setBankCustomMode] = useState(() => {
    const n = (company.settlementBankName ?? "").trim();
    return Boolean(n && !ETHIOPIAN_BANK_NAMES_FOR_SUPPLIER.includes(n));
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const locationFieldId = useId();

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
      }),
      credentials: "same-origin",
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMsg(data.error ?? "Failed to update");
      return;
    }
    setOpen(false);
    router.refresh();
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
            setMsg(null);
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-800 transition hover:bg-violet-100 dark:border-violet-500/30 dark:bg-violet-950/40 dark:text-violet-200 dark:hover:bg-violet-950/60"
        >
          <HiOutlinePencilSquare className="h-4 w-4" />
          Edit profile
        </button>
      ) : (
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
            <label className={supplierLabelClass}>
              License document URL or reference
              <input
                placeholder="Optional"
                value={licenseDocument}
                onChange={(e) => setLicenseDocument(e.target.value)}
                className={supplierInputClass}
              />
            </label>
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

          <div className="mt-6 rounded-2xl border border-base-300 p-4">
            <SupplierFormSectionTitle
              icon={<HiOutlineMapPin className="h-5 w-5" />}
              title="Map & address"
              subtitle="Update your pin or clear the field to remove from public profile."
            />
            <GoogleLocationPicker
              key={`${company.id}-${open}`}
              inputId={locationFieldId}
              label="Business location"
              value={businessAddress}
              onChange={setBusinessAddress}
              onCoordinatesChange={(lat, lng) => {
                setLatitude(lat);
                setLongitude(lng);
              }}
              initialLatitude={latitude}
              initialLongitude={longitude}
              helperText=""
              variant="zinc"
              addressMode="full"
              mapHeightPx={168}
            />
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
              onClick={() => setOpen(false)}
              className={supplierGhostButtonClass}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
