export type BrowseFilterState = {
  minPrice: string;
  maxPrice: string;
  minRating: string;
  stock: string;
  minShip: string;
  region: string;
};

export function buildBrowseHref(
  sort: string,
  categoryId: string,
  f: BrowseFilterState,
) {
  const u = new URLSearchParams();
  u.set("sort", sort);
  if (categoryId) u.set("category", categoryId);
  if (f.minPrice) u.set("minPrice", f.minPrice);
  if (f.maxPrice) u.set("maxPrice", f.maxPrice);
  if (f.minRating) u.set("minRating", f.minRating);
  if (f.stock) u.set("stock", f.stock);
  if (f.minShip) u.set("minShip", f.minShip);
  if (f.region) u.set("region", f.region);
  return `/browse?${u.toString()}`;
}

export function mergeFilters(
  base: BrowseFilterState,
  patch: Partial<BrowseFilterState>,
): BrowseFilterState {
  return {
    minPrice: patch.minPrice !== undefined ? patch.minPrice : base.minPrice,
    maxPrice: patch.maxPrice !== undefined ? patch.maxPrice : base.maxPrice,
    minRating: patch.minRating !== undefined ? patch.minRating : base.minRating,
    stock: patch.stock !== undefined ? patch.stock : base.stock,
    minShip: patch.minShip !== undefined ? patch.minShip : base.minShip,
    region: patch.region !== undefined ? patch.region : base.region,
  };
}
