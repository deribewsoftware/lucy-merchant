"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { PaginatedClientList } from "@/components/paginated-client-list";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { isRichTextEmpty } from "@/lib/rich-text";

type CompanyRow = { id: string; name: string; alreadyReviewed: boolean };

type Props = { orderId: string; companies: CompanyRow[] };

export function CompanyReviewForms({ orderId, companies }: Props) {
  const router = useRouter();
  const [msg, setMsg] = useState<Record<string, string | null>>({});

  const clearErrorsOnPaging = useCallback(() => {
    setMsg({});
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Rate suppliers
      </h2>
      <p className="text-sm text-zinc-500">
        One review per company per order, after completion (verified purchase).
      </p>
      <PaginatedClientList
        items={companies}
        pageSize={5}
        resetKey={companies.map((c) => c.id).join(",")}
        summaryClassName="mb-3"
        summarySuffix="suppliers"
        barClassName="mt-4"
        onReset={clearErrorsOnPaging}
        onPageSelect={clearErrorsOnPaging}
      >
        {(pageItems) => (
          <div className="space-y-6">
            {pageItems.map((c) =>
              c.alreadyReviewed ? (
                <p key={c.id} className="text-sm text-zinc-500">
                  You already reviewed <strong>{c.name}</strong> for this order.
                </p>
              ) : (
                <ReviewForm
                  key={c.id}
                  orderId={orderId}
                  company={c}
                  onDone={() => router.refresh()}
                  onError={(m) => setMsg((s) => ({ ...s, [c.id]: m }))}
                  error={msg[c.id]}
                />
              ),
            )}
          </div>
        )}
      </PaginatedClientList>
    </div>
  );
}

function ReviewForm({
  orderId,
  company,
  onDone,
  onError,
  error,
}: {
  orderId: string;
  company: CompanyRow;
  onDone: () => void;
  onError: (m: string) => void;
  error: string | null | undefined;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (isRichTextEmpty(comment)) return;
    setLoading(true);
    const res = await fetch("/api/reviews/company", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        companyId: company.id,
        rating,
        comment,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      onError(data.error ?? "Failed");
      return;
    }
    setComment("");
    onDone();
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
    >
      <p className="font-medium text-zinc-900 dark:text-zinc-50">
        {company.name}
      </p>
      <label className="mt-3 flex items-center gap-2 text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">Rating</span>
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="rounded border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-950"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} stars
            </option>
          ))}
        </select>
      </label>
      <div className="mt-2">
        <RichTextEditor
          value={comment}
          onChange={setComment}
          placeholder="Share feedback for other merchants…"
          variant="zinc"
          editorMinHeightClass="min-h-[5.5rem] sm:min-h-[6.5rem]"
          aria-label="Company review comment"
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {loading ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
