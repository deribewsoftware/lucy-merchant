"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import {
  HiOutlineCube,
  HiOutlineCurrencyDollar,
  HiOutlinePhoto,
  HiOutlineSparkles,
  HiOutlineTag,
  HiOutlineTruck,
} from "react-icons/hi2";
import type { Category, Company } from "@/lib/domain/types";
import { EthiopianDeliveryLocation } from "@/components/ethiopian-delivery-location";
import { SupplierCategorySearch } from "@/components/supplier-category-search";
import { SupplierProductHeroMedia } from "@/components/supplier-product-hero-media";
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
  const [shipFromAddress, setShipFromAddress] = useState("");
  const [itemsPerCarton, setItemsPerCarton] = useState("");
  const [itemsPerRim, setItemsPerRim] = useState("");
  const [itemsPerDozen, setItemsPerDozen] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const shipFromFieldId = useId();
  const feedbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(t);
  }, [toast]);

  function showError(text: string) {
    setMsg(text);
    setToast({ kind: "error", text });
    feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!name.trim()) {
      showError("Product name is required.");
      return;
    }
    if (!categoryId.trim()) {
      showError("Choose a category.");
      return;
    }
    if (isRichTextEmpty(description)) {
      showError("Description is required — add text in the editor.");
      return;
    }
    const priceN = Number(price);
    if (!Number.isFinite(priceN) || priceN < 0) {
      showError("Enter a valid sale price (0 or more).");
      return;
    }
    const stockN = Number(availableQuantity);
    if (!Number.isFinite(stockN) || stockN < 0) {
      showError("Enter a valid available quantity (0 or more).");
      return;
    }
    const moqN = Number(minOrderQuantity);
    if (!Number.isFinite(moqN) || moqN < 1) {
      showError("Min order quantity must be at least 1.");
      return;
    }
    if (!deliveryTime.trim()) {
      showError("Delivery time is required.");
      return;
    }
    if (compareAtPrice.trim() !== "") {
      const cmp = Number(compareAtPrice);
      if (!Number.isFinite(cmp) || cmp < 0) {
        showError("List price must be a valid number, or leave it empty.");
        return;
      }
    }
    const maxDelRaw = maxDeliveryQuantity.trim();
    if (maxDelRaw !== "") {
      const n = Number(maxDelRaw);
      if (!Number.isFinite(n) || n < 1) {
        showError(
          "Max delivery must be at least 1, or leave the field empty.",
        );
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          companyId,
          categoryId,
          name: name.trim(),
          description,
          price: priceN,
          compareAtPrice:
            compareAtPrice.trim() === "" ? null : Number(compareAtPrice),
          availableQuantity: stockN,
          minOrderQuantity: moqN,
          deliveryTime: deliveryTime.trim(),
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          imageUrl: imageUrl.trim() || undefined,
          featured,
          shipFromRegion: shipFromAddress.trim().slice(0, 256) || undefined,
          maxDeliveryQuantity:
            maxDeliveryQuantity.trim() === ""
              ? null
              : Number(maxDeliveryQuantity),
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
      if (!res.ok) {
        const err =
          typeof data.error === "string"
            ? data.error
            : "Failed to create product";
        showError(err);
        return;
      }
      setToast({ kind: "success", text: "Product published." });
      window.setTimeout(() => {
        router.push("/supplier/products");
        router.refresh();
      }, 500);
    } catch {
      showError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (verified.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-warning/35 bg-warning/10 p-6">
        <p className="text-sm text-base-content">
          You need at least one verified company before posting products.{" "}
          <Link href="/supplier/companies" className="link link-primary font-semibold">
            Manage companies
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className={`${supplierFormCardClass} relative mt-6 w-full max-w-3xl`}
    >
      {toast ? (
        <div
          className="toast toast-top toast-center z-[100] max-w-[min(100%,24rem)] px-2 sm:toast-end"
          role="status"
          aria-live="polite"
        >
          <div
            className={
              toast.kind === "success"
                ? "alert alert-success shadow-lg"
                : "alert alert-error shadow-lg"
            }
          >
            <span className="text-sm">{toast.text}</span>
          </div>
        </div>
      ) : null}
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
        <SupplierCategorySearch
          categories={categories}
          value={categoryId}
          onChange={setCategoryId}
        />
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
          subtitle="Upload a hero photo or paste a link. Featured placement is optional."
        />
        <SupplierProductHeroMedia imageUrl={imageUrl} onImageUrlChange={setImageUrl} />
        <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-base-300 bg-base-200/30 p-3 sm:p-4">
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
          <div className="sm:col-span-2">
            <label className={supplierLabelClass}>
              Max delivery qty
              <input
                type="number"
                inputMode="numeric"
                placeholder="Optional — cap per shipment"
                value={maxDeliveryQuantity}
                onChange={(e) => setMaxDeliveryQuantity(e.target.value)}
                className={supplierInputClass}
              />
            </label>
            <p className="mt-1.5 text-xs text-base-content/55">
              Leave empty so a single delivery is limited only by available stock.
            </p>
          </div>
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
        <div className="mt-5">
          <EthiopianDeliveryLocation
            inputId={shipFromFieldId}
            label="Ship-from location (optional)"
            value={shipFromAddress}
            onChange={setShipFromAddress}
            helperText="Search Ethiopia to autofill, then edit. We save this as your ship-from label for catalog filters (up to 256 characters)."
            variant="supplier"
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

      <div ref={feedbackRef}>
        {msg ? (
          <p className="alert alert-error mt-4 text-sm" role="alert">
            {msg}
          </p>
        ) : null}
      </div>
      <button
        type="submit"
        disabled={loading}
        aria-busy={loading}
        className={`${supplierPrimaryButtonClass} mt-6 w-full sm:w-auto`}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <span
              className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-90"
              aria-hidden
            />
            Publishing…
          </span>
        ) : (
          <>
            <HiOutlineCube className="h-4 w-4" />
            Publish product
          </>
        )}
      </button>
    </form>
  );
}
