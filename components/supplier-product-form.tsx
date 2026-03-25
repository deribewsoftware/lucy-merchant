"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import {
  HiOutlineCube,
  HiOutlineCurrencyDollar,
  HiOutlinePhoto,
  HiOutlineSparkles,
  HiOutlineTag,
  HiOutlineTruck,
} from "react-icons/hi2";
import type { Category, Company } from "@/lib/domain/types";
import { GoogleLocationPicker } from "@/components/google-location-picker";
import { SupplierFormSectionTitle } from "@/components/supplier/form-section";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  supplierCheckboxClass,
  supplierFormCardClass,
  supplierInputClass,
  supplierLabelClass,
  supplierPrimaryButtonClass,
  supplierSectionClass,
  supplierSelectClass,
} from "@/components/supplier/form-styles";
import { isRichTextEmpty } from "@/lib/rich-text";

type Props = {
  companies: Company[];
  categories: Category[];
  postProductPoints: number;
  featuredProductCost: number;
  freePostingEnabled: boolean;
};

export function SupplierProductForm({
  companies,
  categories,
  postProductPoints,
  featuredProductCost,
  freePostingEnabled,
}: Props) {
  const router = useRouter();
  const verified = companies.filter((c) => c.isVerified);
  const [companyId, setCompanyId] = useState(verified[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [availableQuantity, setAvailableQuantity] = useState("");
  const [minOrderQuantity, setMinOrderQuantity] = useState("1");
  const [maxDeliveryQuantity, setMaxDeliveryQuantity] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("3-5 business days");
  const [tags, setTags] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [featured, setFeatured] = useState(false);
  const [shipFromRegion, setShipFromRegion] = useState("");
  const [itemsPerCarton, setItemsPerCarton] = useState("");
  const [itemsPerRim, setItemsPerRim] = useState("");
  const [itemsPerDozen, setItemsPerDozen] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const shipFromFieldId = useId();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isRichTextEmpty(description)) {
      setMsg("Description is required");
      return;
    }
    setLoading(true);
    setMsg(null);
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId,
        categoryId,
        name,
        description,
        price: Number(price),
        compareAtPrice:
          compareAtPrice.trim() === "" ? null : Number(compareAtPrice),
        availableQuantity: Number(availableQuantity),
        minOrderQuantity: Number(minOrderQuantity),
        maxDeliveryQuantity: Number(maxDeliveryQuantity),
        deliveryTime,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        imageUrl: imageUrl.trim() || undefined,
        featured,
        shipFromRegion: shipFromRegion.trim() || undefined,
        ...(itemsPerCarton.trim() !== ""
          ? { itemsPerCarton: Number(itemsPerCarton) }
          : {}),
        ...(itemsPerRim.trim() !== ""
          ? { itemsPerRim: Number(itemsPerRim) }
          : {}),
        ...(itemsPerDozen.trim() !== ""
          ? { itemsPerDozen: Number(itemsPerDozen) }
          : {}),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMsg(data.error ?? "Failed to create product");
      return;
    }
    router.push("/supplier/products");
    router.refresh();
  }

  if (verified.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-warning/35 bg-warning/10 p-6">
        <p className="text-sm text-base-content">
          You need at least one verified company before posting products.{" "}
          <a href="/supplier/companies" className="link link-primary font-semibold">
            Manage companies
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={`${supplierFormCardClass} mt-6 max-w-2xl`}>
      <SupplierFormSectionTitle
        icon={<HiOutlineCube className="h-5 w-5" />}
        title="Basics"
        subtitle="Company, category, and what buyers see first."
      />
      <div className="space-y-4">
        <label className={supplierLabelClass}>
          Company
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className={supplierSelectClass}
          >
            {verified.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className={supplierLabelClass}>
          Category
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={supplierSelectClass}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className={supplierLabelClass}>
          Product name
          <input
            required
            placeholder="e.g. Organic wheat flour 25kg"
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
            placeholder="Specs, packaging, certifications…"
            variant="supplier"
            className="mt-1"
            editorMinHeightClass="min-h-[8rem] sm:min-h-[9rem]"
            aria-label="Product description"
          />
        </label>
      </div>

      <div className={`${supplierSectionClass} mt-8`}>
        <SupplierFormSectionTitle
          icon={<HiOutlinePhoto className="h-5 w-5" />}
          title="Media & visibility"
          subtitle="Optional hero image and featured placement."
        />
        <label className={supplierLabelClass}>
          Image URL (optional, https)
          <input
            type="url"
            placeholder="https://…"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className={supplierInputClass}
          />
        </label>
        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-base-300 bg-base-200/30 p-3">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className={supplierCheckboxClass}
          />
          <span>
            <span className="flex items-center gap-1.5 text-sm font-semibold text-base-content">
              <HiOutlineSparkles className="h-4 w-4 text-secondary" />
              Featured listing
            </span>
            <span className="mt-1 block text-xs text-base-content/60">
              {featuredProductCost > 0
                ? `Uses ${featuredProductCost} points for higher visibility in search & catalog (after posting cost).`
                : "No extra points configured — still marks the SKU as featured."}
            </span>
          </span>
        </label>
        <p className="mt-3 flex items-center gap-2 text-xs text-base-content/55">
          <HiOutlineTag className="h-3.5 w-3.5 shrink-0" />
          Posting:{" "}
          {freePostingEnabled
            ? "free (system)"
            : `${postProductPoints} points per new SKU`}
          .
        </p>
      </div>

      <div className={`${supplierSectionClass} mt-6`}>
        <SupplierFormSectionTitle
          icon={<HiOutlineCurrencyDollar className="h-5 w-5" />}
          title="Pricing & stock"
          subtitle="Sale price, optional list price, and order limits."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={supplierLabelClass}>
            Sale price (ETB)
            <input
              required
              type="number"
              min={0}
              step="0.01"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={supplierInputClass}
            />
          </label>
          <label className={supplierLabelClass}>
            List price (optional)
            <input
              type="number"
              min={0}
              step="0.01"
              placeholder="Crossed-out “was” price"
              value={compareAtPrice}
              onChange={(e) => setCompareAtPrice(e.target.value)}
              className={supplierInputClass}
            />
          </label>
          <p className="text-xs text-base-content/55 sm:col-span-2">
            If list price is higher than sale price, buyers see it crossed out as
            the “was” price.
          </p>
          <label className={supplierLabelClass}>
            Available quantity
            <input
              required
              type="number"
              min={0}
              placeholder="Units in stock"
              value={availableQuantity}
              onChange={(e) => setAvailableQuantity(e.target.value)}
              className={supplierInputClass}
            />
          </label>
          <label className={supplierLabelClass}>
            Min order qty
            <input
              required
              type="number"
              min={1}
              value={minOrderQuantity}
              onChange={(e) => setMinOrderQuantity(e.target.value)}
              className={supplierInputClass}
            />
          </label>
          <label className={`${supplierLabelClass} sm:col-span-2`}>
            Max delivery qty
            <input
              required
              type="number"
              min={1}
              placeholder="Per single delivery"
              value={maxDeliveryQuantity}
              onChange={(e) => setMaxDeliveryQuantity(e.target.value)}
              className={supplierInputClass}
            />
          </label>
        </div>
      </div>

      <div className={`${supplierSectionClass} mt-6`}>
        <SupplierFormSectionTitle
          icon={<HiOutlineTruck className="h-5 w-5" />}
          title="Logistics & packaging"
          subtitle="Delivery promise, optional pack sizes, ship-from region."
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <label className={supplierLabelClass}>
            Items / carton
            <input
              type="number"
              min={1}
              step={1}
              placeholder="—"
              value={itemsPerCarton}
              onChange={(e) => setItemsPerCarton(e.target.value)}
              className={supplierInputClass}
            />
          </label>
          <label className={supplierLabelClass}>
            Items / rim
            <input
              type="number"
              min={1}
              step={1}
              placeholder="—"
              value={itemsPerRim}
              onChange={(e) => setItemsPerRim(e.target.value)}
              className={supplierInputClass}
            />
          </label>
          <label className={supplierLabelClass}>
            Items / dozen
            <input
              type="number"
              min={1}
              step={1}
              placeholder="e.g. 12"
              value={itemsPerDozen}
              onChange={(e) => setItemsPerDozen(e.target.value)}
              className={supplierInputClass}
            />
          </label>
        </div>
        <p className="mt-2 text-[11px] text-base-content/55">
          If set, search and catalog show minimum order in items, cartons, rims,
          and dozen using your MOQ.
        </p>
        <label className={`${supplierLabelClass} mt-4`}>
          <span className="inline-flex items-center gap-1.5 normal-case tracking-normal">
            <HiOutlineTruck className="h-3.5 w-3.5" />
            Delivery time
          </span>
          <input
            placeholder="e.g. 3-5 business days"
            value={deliveryTime}
            onChange={(e) => setDeliveryTime(e.target.value)}
            className={supplierInputClass}
          />
        </label>
        <div className="mt-4 rounded-xl border border-base-300 p-3">
          <GoogleLocationPicker
            inputId={shipFromFieldId}
            label="Ship-from region (optional)"
            value={shipFromRegion}
            onChange={setShipFromRegion}
            helperText="Pick a city or area; we store a short region label for filters."
            variant="zinc"
            addressMode="region"
            mapHeightPx={160}
          />
        </div>
      </div>

      <label className={`${supplierLabelClass} mt-6`}>
        <span className="inline-flex items-center gap-1.5 normal-case tracking-normal">
          <HiOutlineTag className="h-3.5 w-3.5" />
          Tags (comma-separated)
        </span>
        <input
          placeholder="bulk, organic, wholesale…"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className={supplierInputClass}
        />
      </label>

      {msg && (
        <p className="alert alert-error mt-4 text-sm">
          {msg}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className={`${supplierPrimaryButtonClass} mt-6 w-full sm:w-auto`}
      >
        <HiOutlineCube className="h-4 w-4" />
        {loading ? "Publishing…" : "Publish product"}
      </button>
    </form>
  );
}
