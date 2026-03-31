import { notFound } from "next/navigation";
import { CompanySupplierPublicPage } from "@/components/company-supplier-public-page";
import { getCompanyReviewEligibility } from "@/lib/company-review-eligibility";
import { getCompany, listProducts } from "@/lib/db/catalog";
import { listReviewsForCompany } from "@/lib/db/reviews";
import { findUserById } from "@/lib/db/users";
import { getSessionUser } from "@/lib/server/session";
import { clampPage, pageStartIndex, totalPagesFor } from "@/lib/utils/pagination";

const REVIEW_PAGE_SIZE = 8;

type Params = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; rpage?: string }>;
};

export default async function CompanyPage({ params, searchParams }: Params) {
  const { id } = await params;
  const sp = await searchParams;
  const company = getCompany(id);
  if (!company) notFound();

  const pageRaw = parseInt(sp.page ?? "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;
  const pageSize = 12;

  const allProducts = listProducts()
    .filter((p) => p.companyId === id)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const total = allProducts.length;
  const totalPages = totalPagesFor(total, pageSize);
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const products = allProducts.slice(start, start + pageSize);

  const companyReviews = listReviewsForCompany(id).sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1,
  );

  const reviewsVm = companyReviews.map((r) => {
    const author = findUserById(r.merchantId);
    return {
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      authorName: author?.name?.trim() || "Merchant",
    };
  });

  const reviewsTotal = reviewsVm.length;
  const rpageRaw = parseInt(sp.rpage ?? "1", 10);
  const rpage =
    Number.isFinite(rpageRaw) && rpageRaw >= 1 ? rpageRaw : 1;
  const reviewsSafePage = clampPage(rpage, reviewsTotal, REVIEW_PAGE_SIZE);
  const reviewStart = pageStartIndex(reviewsSafePage, reviewsTotal, REVIEW_PAGE_SIZE);
  const reviewsPageSlice = reviewsVm.slice(
    reviewStart,
    reviewStart + REVIEW_PAGE_SIZE,
  );

  const href = (p: number) => {
    const u = new URLSearchParams();
    if (p > 1) u.set("page", String(p));
    if (reviewsTotal > 0 && reviewsSafePage > 1) {
      u.set("rpage", String(reviewsSafePage));
    }
    const q = u.toString();
    return q ? `/companies/${id}?${q}` : `/companies/${id}`;
  };

  const reviewsPaginationHref = (p: number) => {
    const u = new URLSearchParams();
    if (p > 1) u.set("rpage", String(p));
    if (total > 0 && safePage > 1) u.set("page", String(safePage));
    const q = u.toString();
    const path = q ? `/companies/${id}?${q}` : `/companies/${id}`;
    return `${path}#company-reviews`;
  };

  const sessionUser = await getSessionUser();
  const eligibility = getCompanyReviewEligibility(id, sessionUser);

  return (
    <CompanySupplierPublicPage
      company={company}
      reviews={reviewsPageSlice}
      reviewsForDistribution={reviewsVm}
      reviewsPage={reviewsSafePage}
      reviewsPageSize={REVIEW_PAGE_SIZE}
      reviewsTotal={reviewsTotal}
      reviewsPaginationHref={reviewsPaginationHref}
      products={products}
      safePage={safePage}
      pageSize={pageSize}
      total={total}
      paginationHref={href}
      eligibility={eligibility}
    />
  );
}
