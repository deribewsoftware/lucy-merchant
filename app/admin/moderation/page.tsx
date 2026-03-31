import {
  HiOutlineBuildingStorefront,
  HiOutlineChatBubbleLeftRight,
  HiOutlineShieldCheck,
  HiOutlineStar,
} from "react-icons/hi2";
import {
  AdminModerationLists,
  type ModerationCommentVm,
  type ModerationCompanyReviewVm,
  type ModerationProductReviewVm,
} from "@/components/admin-moderation-lists";
import { getCompany, getProduct } from "@/lib/db/catalog";
import { listAllProductComments } from "@/lib/db/comments";
import { listAllProductReviews } from "@/lib/db/product-reviews";
import { listAllCompanyReviews } from "@/lib/db/reviews";
import { findUserById } from "@/lib/db/users";
import { requireStaffPagePermission } from "@/lib/server/require-staff-page";

export default async function AdminModerationPage() {
  await requireStaffPagePermission("moderation:manage", "/admin/moderation");

  const comments = listAllProductComments().slice().reverse();
  const companyReviews = listAllCompanyReviews().slice().reverse();
  const productReviews = listAllProductReviews().slice().reverse();

  const commentsVm: ModerationCommentVm[] = comments.map((c) => ({
    id: c.id,
    productId: c.productId,
    productName: getProduct(c.productId)?.name ?? c.productId,
    userName: c.userName,
    commentHtml: c.comment,
  }));

  const companyReviewsVm: ModerationCompanyReviewVm[] = companyReviews.map((r) => {
    const co = getCompany(r.companyId);
    const author = findUserById(r.merchantId);
    return {
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      companyName: co?.name ?? r.companyId,
      authorName: author?.name ?? r.merchantId,
    };
  });

  const productReviewsVm: ModerationProductReviewVm[] = productReviews.map((r) => {
    const p = getProduct(r.productId);
    const author = findUserById(r.merchantId);
    return {
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      productName: p?.name ?? r.productId,
      authorName: author?.name ?? r.merchantId,
    };
  });

  return (
    <div className="space-y-12">
      <header className="flex flex-col gap-4 border-b border-base-300 pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-error/10 text-error">
            <HiOutlineShieldCheck className="h-7 w-7" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-base-content">
              Moderation
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-base-content/60">
              Remove harmful or policy-breaking UGC. Deleting reviews and
              comments updates aggregates where the data layer supports it.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-base-200 px-3 py-1 text-xs font-medium text-base-content/70">
            <HiOutlineChatBubbleLeftRight className="h-3.5 w-3.5" />
            {comments.length} comments
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-base-200 px-3 py-1 text-xs font-medium text-base-content/70">
            <HiOutlineBuildingStorefront className="h-3.5 w-3.5" />
            {companyReviews.length} company
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-base-200 px-3 py-1 text-xs font-medium text-base-content/70">
            <HiOutlineStar className="h-3.5 w-3.5" />
            {productReviews.length} product
          </span>
        </div>
      </header>

      <AdminModerationLists
        comments={commentsVm}
        companyReviews={companyReviewsVm}
        productReviews={productReviewsVm}
      />
    </div>
  );
}
