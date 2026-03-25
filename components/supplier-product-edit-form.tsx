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
import type { Category, Product } from "@/lib/domain/types";
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
type Props = {
  product: Product;
  categories: Category[];
  featuredProductCost: number;
};

export function SupplierProductEditForm({
  product,
  categories,
  featuredProductCost,
}: Props) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState(product.categoryId);
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [price, setPrice] = useState(String(product.price));
  const [compareAtPrice, setCompareAtPrice] = useState(
    product.compareAtPrice != null ? String(product.compareAtPrice) : "",
  );
  const [availableQuantity, setAvailableQuantity] = useState(
    String(product.availableQuantity),
  );
  const [minOrderQuantity, setMinOrderQuantity] = useState(
    String(product.minOrderQuantity),
  );
  const [maxDeliveryQuantity, setMaxDeliveryQuantity] = useState(
    String(product.maxDeliveryQuantity),
  );
  const [deliveryTime, setDeliveryTime] = useState(product.deliveryTime);
  const [tags, setTags] = useState(product.tags.join(", "));
  const [imageUrl, setImageUrl] = useState(product.imageUrl ?? "");
  const [featured, setFeatured] = useState(Boolean(product.isFeatured));
  const [shipFromRegion, setShipFromRegion] = useState(
    product.shipFromRegion ?? "",
  );
  const [itemsPerCarton, setItemsPerCarton] = useState(
    product.itemsPerCarton != null ? String(product.itemsPerCarton) : "",
  );
  const [itemsPerRim, setItemsPerRim] = useState(
    product.itemsPerRim != null ? String(product.itemsPerRim) : "",
  );
  const [itemsPerDozen, setItemsPerDozen] = useState(
    product.itemsPerDozen != null ? String(product.itemsPerDozen) : "",
  );
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const shipFromFieldId = useId();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const res = await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
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
        itemsPerCarton:
          itemsPerCarton.trim() === "" ? null : Number(itemsPerCarton),
        itemsPerRim: itemsPerRim.trim() === "" ? null : Number(itemsPerRim),
        itemsPerDozen:
          itemsPerDozen.trim() === "" ? null : Number(itemsPerDozen),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMsg(data.error ?? "Failed to update product");
      return;
    }
    router.push("/supplier/products");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className={`${supplierFormCardClass} mt-6 max-w-2xl`}>
      <p className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-base-300 bg-base-200/30 px-4 py-3 text-sm text-base-content/70">
        <HiOutlineCube className="h-4 w-4 text-primary" />
        Listing ID{" "}
        <span className="font-mono text-xs text-base-content">
          {product.id}
        </span>
        — company cannot be changed here.
      </p>

      <SupplierFormSectionTitle
        icon={<HiOutlineCube className="h-5 w-5" />}
        title="Listing basics"
      />
      <div className="space-y-4">
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
        />
        <label className={supplierLabelClass}>
          Image URL (optional — leave empty to remove)
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
              {featuredProductCost > 0 && !product.isFeatured
                ? `Turning this on uses ${featuredProductCost} points (one-time for this SKU).`
                : featuredProductCost > 0 && product.isFeatured
                  ? "Already featured — uncheck to remove boosted visibility."
                  : "Marks the SKU as featured in catalog sort."}
            </span>
          </span>
        </label>
      </div>

      <div className={`${supplierSectionClass} mt-6`}>
        <SupplierFormSectionTitle
          icon={<HiOutlineCurrencyDollar className="h-5 w-5" />}
          title="Pricing & stock"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={supplierLabelClass}>
            Sale price (ETB)
            <input
              required
              type="number"
              min={0}
              step="0.01"
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
              value={compareAtPrice}
              onChange={(e) => setCompareAtPrice(e.target.value)}
              className={supplierInputClass}
            />
          </label>
          <p className="text-xs text-base-content/55 sm:col-span-2">
            List price must be higher than sale price to show a crossed-out “was”
            price. Leave empty to remove.
          </p>
          <label className={supplierLabelClass}>
            Available quantity
            <input
              required
              type="number"
              min={0}
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
          Leave blank to clear. Used for min order display in search.
        </p>
        <label className={`${supplierLabelClass} mt-4`}>
          Delivery time
          <input
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
        {loading ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
