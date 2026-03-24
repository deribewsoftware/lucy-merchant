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
import {
  supplierFormCardClass,
  supplierGhostButtonClass,
  supplierInputClass,
  supplierLabelClass,
  supplierPrimaryButtonClass,
  supplierTextareaClass,
} from "@/components/supplier/form-styles";

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
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const locationFieldId = useId();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
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
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={supplierTextareaClass}
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
