import { HomeView } from "@/components/home/home-view";
import { getCategories, listCompanies, listProducts } from "@/lib/db/catalog";
import {
  completedUnitsByCompany,
  sortCompaniesByReputationAndVolume,
} from "@/lib/db/marketplace-stats";

export default function HomePage() {
  const products = listProducts();
  const companies = listCompanies().filter((c) => c.isVerified);

  const feat = (a: (typeof products)[0], b: (typeof products)[0]) =>
    Number(!!b.isFeatured) - Number(!!a.isFeatured);

  const trendScore = (p: (typeof products)[0]) =>
    p.totalOrdersCount * 1000 + (p.viewCount ?? 0);

  const trending = [...products].sort(
    (a, b) => feat(a, b) || trendScore(b) - trendScore(a),
  );
  const topRated = [...products].sort(
    (a, b) => feat(a, b) || b.averageRating - a.averageRating,
  );
  const newest = [...products].sort(
    (a, b) => feat(a, b) || (a.createdAt < b.createdAt ? 1 : -1),
  );

  const seenRec = new Set<string>();
  const recommended: typeof products = [];
  for (const p of [...trending, ...topRated, ...newest]) {
    if (seenRec.has(p.id)) continue;
    seenRec.add(p.id);
    recommended.push(p);
    if (recommended.length >= 4) break;
  }

  const volume = completedUnitsByCompany();
  const topCompanies = sortCompaniesByReputationAndVolume(companies, volume);
  const categories = getCategories().map((c) => ({ id: c.id, name: c.name }));

  const mapProduct = (p: (typeof products)[0]) => ({
    id: p.id,
    name: p.name,
    minOrderQuantity: p.minOrderQuantity,
    maxDeliveryQuantity: p.maxDeliveryQuantity,
    deliveryTime: p.deliveryTime,
    availableQuantity: p.availableQuantity,
    ...(p.itemsPerCarton != null && p.itemsPerCarton > 0
      ? { itemsPerCarton: p.itemsPerCarton }
      : {}),
    ...(p.itemsPerRim != null && p.itemsPerRim > 0
      ? { itemsPerRim: p.itemsPerRim }
      : {}),
    ...(p.itemsPerDozen != null && p.itemsPerDozen > 0
      ? { itemsPerDozen: p.itemsPerDozen }
      : {}),
    price: p.price,
    ...(p.compareAtPrice != null && p.compareAtPrice > p.price
      ? { compareAtPrice: p.compareAtPrice }
      : {}),
    isFeatured: !!p.isFeatured,
  });

  return (
    <HomeView
      categories={categories}
      trending={trending.slice(0, 4).map(mapProduct)}
      topRated={topRated.slice(0, 4).map(mapProduct)}
      newest={newest.slice(0, 4).map(mapProduct)}
      recommended={recommended.slice(0, 4).map(mapProduct)}
      topCompanies={topCompanies.slice(0, 4).map((c) => ({
        id: c.id,
        name: c.name,
        isVerified: c.isVerified,
        ratingAverage: c.ratingAverage,
        totalReviews: c.totalReviews,
      }))}
    />
  );
}
