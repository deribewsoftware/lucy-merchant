"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import {
  HiOutlineBuildingOffice2,
  HiOutlineDocumentText,
  HiOutlineMapPin,
} from "react-icons/hi2";
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
import { SupplierHeroBackdrop } from "@/components/supplier/supplier-portal-graphics";

export function SupplierCompanyForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [licenseDocument, setLicenseDocument] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const locationFieldId = useId();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMsg(data.error ?? "Failed");
      return;
    }
    setName("");
    setDescription("");
    setLicenseDocument("");
    setBusinessAddress("");
    setLatitude(null);
    setLongitude(null);
    router.refresh();
  }

  return (
    <div className="relative mt-8 overflow-hidden rounded-2xl border border-base-300 bg-gradient-to-br from-base-100 to-primary/[0.05] p-1 shadow-sm ring-1 ring-base-300/20">
      <SupplierHeroBackdrop />
      <form
        onSubmit={onSubmit}
        className={`relative ${supplierFormCardClass} border-0 bg-base-100/95 shadow-none backdrop-blur-sm`}
      >
        <SupplierFormSectionTitle
          icon={<HiOutlineBuildingOffice2 className="h-5 w-5" />}
          title="Register a company"
          subtitle="Admins verify your profile before you can publish SKUs."
        />
        <div className="space-y-4">
          <label className={supplierLabelClass}>
            Legal / brand name
            <input
              required
              placeholder="Company name"
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
            <textarea
              required
              placeholder="What you supply, regions, certifications…"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={supplierTextareaClass}
            />
          </label>
          <label className={supplierLabelClass}>
            License document URL or reference (optional)
            <input
              placeholder="Link or filing reference"
              value={licenseDocument}
              onChange={(e) => setLicenseDocument(e.target.value)}
              className={supplierInputClass}
            />
          </label>
        </div>

        <div className="mt-6 rounded-2xl border border-base-300 p-4">
          <SupplierFormSectionTitle
            icon={<HiOutlineMapPin className="h-5 w-5" />}
            title="Business location"
            subtitle="Optional — helps buyers find you on the map."
          />
          <GoogleLocationPicker
            inputId={locationFieldId}
            label="Address"
            value={businessAddress}
            onChange={setBusinessAddress}
            onCoordinatesChange={(lat, lng) => {
              setLatitude(lat);
              setLongitude(lng);
            }}
            helperText="You can skip this and add it later when editing."
            variant="zinc"
            addressMode="full"
            mapHeightPx={180}
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
              setMsg(null);
            }}
          >
            Clear form
          </button>
        </div>
      </form>
    </div>
  );
}
