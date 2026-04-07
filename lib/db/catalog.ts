import { randomUUID } from "crypto";
import { normalizeRecommendationCategoryIds } from "@/lib/domain/company-recommendation-categories";
import {
  MAX_COMPANY_SETTLEMENT_BANK_ACCOUNTS,
} from "@/lib/domain/company-settlement-accounts";
import type {
  Category,
  Company,
  CompanySettlementBankAccount,
  Product,
  SystemConfig,
} from "@/lib/domain/types";
import { readJsonFile, writeJsonFile } from "@/lib/store/json-file";

const CATEGORIES = "categories.json";
const COMPANIES = "companies.json";
const PRODUCTS = "products.json";
const SYSTEM = "system.json";

function defaultSystem(): SystemConfig {
  return {
    postProductPoints: 5,
    orderCommissionPercent: 3,
    supplierOrderCommissionPercent: 2,
    featuredProductCost: 50,
    freePostingEnabled: false,
    freeCommissionEnabled: false,
    freeSupplierCommissionEnabled: false,
    commissionPaymentGraceHours: 72,
  };
}

function seedCategories(): Category[] {
  const c1 = randomUUID();
  const c2 = randomUUID();
  return [
    { id: c1, name: "Building materials", parentId: null },
    { id: c2, name: "Cement", parentId: c1 },
  ];
}

export function getSystemConfig(): SystemConfig {
  const base = defaultSystem();
  const stored = readJsonFile<Partial<SystemConfig>>(SYSTEM, base);
  return { ...base, ...stored };
}

export function updateSystemConfig(patch: Partial<SystemConfig>): SystemConfig {
  const cur = getSystemConfig();
  const next = { ...cur, ...patch };
  writeJsonFile(SYSTEM, next);
  return next;
}

export function getCategories(): Category[] {
  let cats = readJsonFile<Category[]>(CATEGORIES, []);
  if (cats.length === 0) {
    cats = seedCategories();
    writeJsonFile(CATEGORIES, cats);
  }
  return cats;
}

export function addCategory(name: string, parentId: string | null): Category {
  const cats = getCategories();
  const category: Category = {
    id: randomUUID(),
    name: name.trim(),
    parentId,
  };
  cats.push(category);
  writeJsonFile(CATEGORIES, cats);
  return category;
}

export function updateCategory(
  id: string,
  patch: { name?: string; parentId?: string | null },
): Category | undefined {
  const cats = getCategories();
  const i = cats.findIndex((c) => c.id === id);
  if (i === -1) return undefined;
  const cur = cats[i];
  const next: Category = { ...cur };

  if (patch.name !== undefined) {
    const n = patch.name.trim();
    if (!n) return undefined;
    next.name = n;
  }
  if (patch.parentId !== undefined) {
    const p = patch.parentId;
    if (p === id) return undefined;
    if (p !== null && !cats.some((c) => c.id === p)) return undefined;
    let walk: string | null = p;
    while (walk) {
      if (walk === id) return undefined;
      const parent = cats.find((c) => c.id === walk);
      walk = parent?.parentId ?? null;
    }
    next.parentId = p;
  }

  cats[i] = next;
  writeJsonFile(CATEGORIES, cats);
  return next;
}

export function listCompanies(): Company[] {
  return readJsonFile<Company[]>(COMPANIES, []);
}

export function getCompany(id: string): Company | undefined {
  return listCompanies().find((c) => c.id === id);
}

export function createCompany(input: {
  ownerId: string;
  name: string;
  description: string;
  licenseDocument?: string;
  businessAddress?: string;
  latitude?: number;
  longitude?: number;
  tinNumber?: string;
  tradeLicenseNumber?: string;
  tradeLicenseDocument?: string;
  recommendationCategoryIds?: string[];
}): Company {
  const all = listCompanies();
  const validCatIds = new Set(getCategories().map((c) => c.id));
  const recIds = normalizeRecommendationCategoryIds(
    input.recommendationCategoryIds,
    validCatIds,
  );
  const addr = input.businessAddress?.trim();
  const lat =
    typeof input.latitude === "number" && Number.isFinite(input.latitude)
      ? input.latitude
      : undefined;
  const lng =
    typeof input.longitude === "number" && Number.isFinite(input.longitude)
      ? input.longitude
      : undefined;
  const company: Company = {
    id: randomUUID(),
    ownerId: input.ownerId,
    name: input.name.trim(),
    description: input.description.trim(),
    licenseDocument: input.licenseDocument,
    businessAddress: addr || undefined,
    latitude: lat,
    longitude: lng,
    isVerified: false,
    ratingAverage: 0,
    totalReviews: 0,
    createdAt: new Date().toISOString(),
    tinNumber: input.tinNumber?.trim() || undefined,
    tradeLicenseNumber: input.tradeLicenseNumber?.trim() || undefined,
    tradeLicenseDocument: input.tradeLicenseDocument?.trim() || undefined,
    verificationStatus: "pending",
    ...(recIds.length > 0 ? { recommendationCategoryIds: recIds } : {}),
  };
  all.push(company);
  writeJsonFile(COMPANIES, all);
  return company;
}

export function setCompanyVerified(
  companyId: string,
  isVerified: boolean,
  adminId?: string,
  rejectionReason?: string,
): Company | undefined {
  const all = listCompanies();
  const i = all.findIndex((c) => c.id === companyId);
  if (i === -1) return undefined;
  all[i] = {
    ...all[i],
    isVerified,
    verificationStatus: isVerified ? "approved" : "rejected",
    reviewedAt: new Date().toISOString(),
    reviewedBy: adminId,
    rejectionReason: isVerified ? undefined : (rejectionReason?.trim() || undefined),
  };
  writeJsonFile(COMPANIES, all);
  return all[i];
}

export function updateCompany(
  id: string,
  patch: Partial<
    Pick<
      Company,
      | "name"
      | "description"
      | "licenseDocument"
      | "logo"
      | "businessAddress"
      | "settlementBankAccounts"
      | "settlementBankName"
      | "settlementAccountName"
      | "settlementAccountNumber"
      | "tinNumber"
      | "tradeLicenseNumber"
      | "tradeLicenseDocument"
      | "recommendationCategoryIds"
    >
  > & { latitude?: number | null; longitude?: number | null },
): Company | undefined {
  const all = listCompanies();
  const i = all.findIndex((c) => c.id === id);
  if (i === -1) return undefined;
  const cur = all[i];
  const next = { ...cur };

  if (patch.name !== undefined) {
    const n = patch.name.trim();
    if (!n) return undefined;
    next.name = n;
  }
  if (patch.description !== undefined) {
    const d = patch.description.trim();
    if (!d) return undefined;
    next.description = d;
  }
  if (patch.licenseDocument !== undefined) {
    const raw = String(patch.licenseDocument ?? "").trim();
    next.licenseDocument = raw || undefined;
  }
  if (patch.logo !== undefined) {
    const raw = String(patch.logo ?? "").trim();
    next.logo = raw && /^https?:\/\//i.test(raw) ? raw : undefined;
  }
  if (patch.businessAddress !== undefined) {
    const raw = String(patch.businessAddress ?? "").trim();
    next.businessAddress = raw || undefined;
    if (!raw) {
      next.latitude = undefined;
      next.longitude = undefined;
    }
  }
  if (patch.latitude !== undefined) {
    const lat = patch.latitude;
    if (lat === null || !Number.isFinite(lat)) {
      next.latitude = undefined;
    } else {
      next.latitude = lat;
    }
  }
  if (patch.longitude !== undefined) {
    const lng = patch.longitude;
    if (lng === null || !Number.isFinite(lng)) {
      next.longitude = undefined;
    } else {
      next.longitude = lng;
    }
  }
  if (patch.settlementBankAccounts !== undefined) {
    const raw = Array.isArray(patch.settlementBankAccounts)
      ? patch.settlementBankAccounts
      : [];
    const normalized: CompanySettlementBankAccount[] = [];
    for (const a of raw.slice(0, MAX_COMPANY_SETTLEMENT_BANK_ACCOUNTS)) {
      if (!a || typeof a !== "object") continue;
      const row = a as Partial<CompanySettlementBankAccount>;
      const bankName = String(row.bankName ?? "").trim();
      const accountName = String(row.accountName ?? "").trim();
      const accountNumber = String(row.accountNumber ?? "").trim();
      if (!bankName && !accountName && !accountNumber) continue;
      const id =
        typeof row.id === "string" && row.id.trim().length > 0
          ? row.id.trim()
          : randomUUID();
      normalized.push({ id, bankName, accountName, accountNumber });
    }
    next.settlementBankAccounts =
      normalized.length > 0 ? normalized : undefined;
    if (normalized.length > 0) {
      const first = normalized[0];
      next.settlementBankName = first.bankName || undefined;
      next.settlementAccountName = first.accountName || undefined;
      next.settlementAccountNumber = first.accountNumber || undefined;
    } else {
      next.settlementBankName = undefined;
      next.settlementAccountName = undefined;
      next.settlementAccountNumber = undefined;
    }
  } else {
    if (patch.settlementBankName !== undefined) {
      const v = String(patch.settlementBankName ?? "").trim();
      next.settlementBankName = v || undefined;
    }
    if (patch.settlementAccountName !== undefined) {
      const v = String(patch.settlementAccountName ?? "").trim();
      next.settlementAccountName = v || undefined;
    }
    if (patch.settlementAccountNumber !== undefined) {
      const v = String(patch.settlementAccountNumber ?? "").trim();
      next.settlementAccountNumber = v || undefined;
    }
  }
  if (patch.tinNumber !== undefined) {
    const v = String(patch.tinNumber ?? "").trim();
    next.tinNumber = v || undefined;
  }
  if (patch.tradeLicenseNumber !== undefined) {
    const v = String(patch.tradeLicenseNumber ?? "").trim();
    next.tradeLicenseNumber = v || undefined;
  }
  if (patch.tradeLicenseDocument !== undefined) {
    const v = String(patch.tradeLicenseDocument ?? "").trim();
    next.tradeLicenseDocument = v || undefined;
  }
  if (patch.recommendationCategoryIds !== undefined) {
    const validCatIds = new Set(getCategories().map((c) => c.id));
    const ids = normalizeRecommendationCategoryIds(
      patch.recommendationCategoryIds,
      validCatIds,
    );
    next.recommendationCategoryIds = ids.length > 0 ? ids : undefined;
  }

  all[i] = next;
  writeJsonFile(COMPANIES, all);
  return next;
}

export function companiesByOwner(ownerId: string): Company[] {
  return listCompanies().filter((c) => c.ownerId === ownerId);
}

/** Remove a company row only — delete products and related data before calling. */
export function removeCompanyRecord(companyId: string): boolean {
  const all = listCompanies();
  const next = all.filter((c) => c.id !== companyId);
  if (next.length === all.length) return false;
  writeJsonFile(COMPANIES, next);
  return true;
}

/** Products belonging to any company owned by this supplier (newest first). */
export function productsForOwner(ownerId: string): Product[] {
  const mine = new Set(companiesByOwner(ownerId).map((c) => c.id));
  return listProducts()
    .filter((p) => mine.has(p.companyId))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function listProducts(): Product[] {
  let products = readJsonFile<Product[]>(PRODUCTS, []);
  if (products.length === 0) {
    const existingCompanies = listCompanies();
    /** Avoid injecting "Demo Verified Co." when real suppliers already exist (e.g. after wiping products only). */
    if (existingCompanies.length > 0) {
      return products;
    }
    const cats = getCategories();
    const rootCat = cats[0];
    if (rootCat) {
      const demoCompany: Company = {
        id: randomUUID(),
        ownerId: "seed",
        name: "Demo Verified Co.",
        description: "Sample verified supplier for marketplace exploration.",
        isVerified: true,
        ratingAverage: 4.6,
        totalReviews: 12,
        createdAt: new Date().toISOString(),
      };
      const companies = listCompanies();
      if (!companies.some((c) => c.name === demoCompany.name)) {
        companies.push(demoCompany);
        writeJsonFile(COMPANIES, companies);
      }
      const verified = companies.find((c) => c.name === demoCompany.name)!;
      products = [
        {
          id: randomUUID(),
          companyId: verified.id,
          name: "Portland Cement 50kg",
          description: "High-grade cement suitable for structural work.",
          categoryId: rootCat.id,
          tags: ["cement", "bulk", "construction"],
          price: 420,
          availableQuantity: 500,
          minOrderQuantity: 10,
          maxDeliveryQuantity: 200,
          deliveryTime: "3-5 business days",
          totalOrdersCount: 48,
          averageRating: 4.7,
          createdAt: new Date().toISOString(),
        },
        {
          id: randomUUID(),
          companyId: verified.id,
          name: "Steel Rebar 12mm",
          description: "Corrosion-resistant rebar for commercial projects.",
          categoryId: rootCat.id,
          tags: ["steel", "rebar"],
          price: 95,
          availableQuantity: 2000,
          minOrderQuantity: 100,
          maxDeliveryQuantity: 800,
          deliveryTime: "5-7 business days",
          totalOrdersCount: 120,
          averageRating: 4.5,
          createdAt: new Date().toISOString(),
        },
      ];
      writeJsonFile(PRODUCTS, products);
    }
  }
  return products;
}

export function deleteCategory(
  id: string,
): { ok: true } | { ok: false; error: string } {
  const cats = getCategories();
  if (!cats.some((c) => c.id === id)) {
    return { ok: false, error: "Not found" };
  }
  if (cats.some((c) => c.parentId === id)) {
    return {
      ok: false,
      error: "Reassign or delete child categories first",
    };
  }
  if (listProducts().some((p) => p.categoryId === id)) {
    return {
      ok: false,
      error: "Reassign or delete products in this category first",
    };
  }
  writeJsonFile(
    CATEGORIES,
    cats.filter((c) => c.id !== id),
  );
  return { ok: true };
}

export function getProduct(id: string): Product | undefined {
  return listProducts().find((p) => p.id === id);
}

/** Same category, verified seller, excluding current — PDF product detail “related”. */
export function listRelatedProducts(
  productId: string,
  limit: number,
): Product[] {
  const p = getProduct(productId);
  if (!p) return [];
  const verified = new Set(
    listCompanies().filter((c) => c.isVerified).map((c) => c.id),
  );
  return listProducts()
    .filter(
      (x) =>
        x.id !== productId &&
        x.categoryId === p.categoryId &&
        verified.has(x.companyId),
    )
    .sort(
      (a, b) =>
        Number(!!b.isFeatured) - Number(!!a.isFeatured) ||
        b.totalOrdersCount - a.totalOrdersCount ||
        b.averageRating - a.averageRating,
    )
    .slice(0, limit);
}

export function createProduct(input: Omit<Product, "id" | "createdAt">): Product {
  const all = listProducts();
  const product: Product = {
    ...input,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  };
  all.push(product);
  writeJsonFile(PRODUCTS, all);
  return product;
}

export function updateProduct(
  productId: string,
  patch: Partial<Omit<Product, "id" | "createdAt">>,
  options?: { removeKeys?: (keyof Product)[] },
): Product | undefined {
  const all = listProducts();
  const i = all.findIndex((p) => p.id === productId);
  if (i === -1) return undefined;
  const merged = { ...all[i], ...patch };
  for (const k of options?.removeKeys ?? []) {
    delete (merged as Record<string, unknown>)[k as string];
  }
  all[i] = merged;
  writeJsonFile(PRODUCTS, all);
  return all[i];
}

export function deleteProduct(productId: string): boolean {
  const all = listProducts();
  const next = all.filter((p) => p.id !== productId);
  if (next.length === all.length) return false;
  writeJsonFile(PRODUCTS, next);
  return true;
}

export function updateProductStock(
  productId: string,
  delta: number,
): Product | undefined {
  const all = listProducts();
  const i = all.findIndex((p) => p.id === productId);
  if (i === -1) return undefined;
  const nextQty = all[i].availableQuantity + delta;
  all[i] = { ...all[i], availableQuantity: Math.max(0, nextQty) };
  writeJsonFile(PRODUCTS, all);
  return all[i];
}

export function incrementProductOrders(productId: string): void {
  const all = listProducts();
  const i = all.findIndex((p) => p.id === productId);
  if (i === -1) return;
  all[i] = {
    ...all[i],
    totalOrdersCount: all[i].totalOrdersCount + 1,
  };
  writeJsonFile(PRODUCTS, all);
}

/** PDF: trending uses views / engagement — count product detail loads */
export function incrementProductViewCount(productId: string): void {
  const all = listProducts();
  const i = all.findIndex((p) => p.id === productId);
  if (i === -1) return;
  const cur = all[i].viewCount ?? 0;
  all[i] = { ...all[i], viewCount: cur + 1 };
  writeJsonFile(PRODUCTS, all);
}

export function setCompanyReviewStats(
  companyId: string,
  ratingAverage: number,
  totalReviews: number,
): void {
  const all = listCompanies();
  const i = all.findIndex((c) => c.id === companyId);
  if (i === -1) return;
  all[i] = {
    ...all[i],
    ratingAverage: Math.round(ratingAverage * 10) / 10,
    totalReviews,
  };
  writeJsonFile(COMPANIES, all);
}

export function setProductRatingStats(
  productId: string,
  ratingAverage: number,
): void {
  const all = listProducts();
  const i = all.findIndex((p) => p.id === productId);
  if (i === -1) return;
  all[i] = {
    ...all[i],
    averageRating: Math.round(ratingAverage * 10) / 10,
  };
  writeJsonFile(PRODUCTS, all);
}
