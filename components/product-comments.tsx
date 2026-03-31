"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageCircle, ThumbsUp } from "lucide-react";
import { RichTextContent } from "@/components/rich-text-content";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { PaginationBar, PaginationSummary } from "@/components/ui/pagination-bar";
import type { ProductComment } from "@/lib/domain/types";
import { isRichTextEmpty } from "@/lib/rich-text";
import { clampPage, pageStartIndex } from "@/lib/utils/pagination";

const THREAD_PAGE_SIZE = 8;

type Props = {
  productId: string;
  canPost: boolean;
  currentUserId: string | null;
};

export function ProductComments({
  productId,
  canPost,
  currentUserId,
}: Props) {
  const [comments, setComments] = useState<ProductComment[]>([]);
  const [text, setText] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [threadPage, setThreadPage] = useState(1);

  const load = useCallback(async () => {
    const res = await fetch(`/api/products/${productId}/comments`);
    if (!res.ok) return;
    const data = await res.json();
    setComments(data.comments ?? []);
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canPost || isRichTextEmpty(text)) return;
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/products/${productId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment: text, parentId }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to post");
      return;
    }
    setText("");
    setParentId(null);
    await load();
  }

  const roots = useMemo(
    () => comments.filter((c) => !c.parentId),
    [comments],
  );
  const byParent = (pid: string) =>
    comments.filter((c) => c.parentId === pid);

  useEffect(() => {
    setThreadPage(1);
  }, [roots.length]);

  const rootTotal = roots.length;
  const threadSafePage = clampPage(threadPage, rootTotal, THREAD_PAGE_SIZE);
  const threadStart = pageStartIndex(threadSafePage, rootTotal, THREAD_PAGE_SIZE);
  const rootsPage = roots.slice(threadStart, threadStart + THREAD_PAGE_SIZE);

  async function toggleLike(commentId: string) {
    if (!currentUserId) return;
    const res = await fetch(
      `/api/products/${productId}/comments/${commentId}/like`,
      { method: "POST" },
    );
    if (res.ok) await load();
  }

  return (
    <section className="mt-10 rounded-2xl border border-border/50 bg-card/60 p-6 shadow-sm ring-1 ring-border/15 sm:mt-12 sm:p-8">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
          <MessageCircle className="h-5 w-5" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">
            Questions & comments
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Threaded discussion. Sign in to like replies.
          </p>
        </div>
      </div>

      {canPost && (
        <form
          onSubmit={submit}
          className="mt-6 rounded-xl border border-border/50 bg-base-100/90 p-4 shadow-inner sm:p-5"
        >
          {parentId && (
            <p className="mb-3 text-xs text-muted-foreground">
              Replying in thread —{" "}
              <button
                type="button"
                className="font-medium text-primary underline-offset-2 hover:underline"
                onClick={() => setParentId(null)}
              >
                Cancel
              </button>
            </p>
          )}
          <RichTextEditor
            value={text}
            onChange={setText}
            placeholder="Ask a question or leave a note…"
            variant="default"
            editorMinHeightClass="min-h-[6.5rem] sm:min-h-[7.5rem]"
            className="mt-0.5"
            aria-label="Comment"
          />
          {error && (
            <div
              role="alert"
              className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 inline-flex h-11 min-w-[8rem] items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : null}
            {loading ? "Posting…" : "Post"}
          </button>
        </form>
      )}
      {!canPost && (
        <div className="mt-6 rounded-xl border border-info/25 bg-info/5 px-4 py-3 text-sm text-muted-foreground">
          <a
            href="/login"
            className="font-semibold text-primary underline-offset-2 hover:underline"
          >
            Sign in
          </a>{" "}
          as merchant or supplier to join the thread.
        </div>
      )}

      {rootTotal > 0 && (
        <PaginationSummary
          page={threadSafePage}
          pageSize={THREAD_PAGE_SIZE}
          total={rootTotal}
          className="mt-8 text-sm text-muted-foreground"
        />
      )}

      <ul className="mt-4 space-y-4">
        {roots.length === 0 && (
          <li className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
            No comments yet — be the first to ask a question.
          </li>
        )}
        {rootsPage.map((c) => (
          <li
            key={c.id}
            className="overflow-hidden rounded-xl border border-border/50 bg-base-100/90 shadow-sm"
          >
            <div className="p-4 sm:p-5">
              <p className="font-semibold text-foreground">{c.userName}</p>
              <time
                className="text-xs text-muted-foreground"
                dateTime={c.createdAt}
              >
                {new Date(c.createdAt).toLocaleString()}
              </time>
              <div className="mt-3 text-sm leading-relaxed text-muted-foreground">
                <RichTextContent html={c.comment} variant="compact" />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={!currentUserId}
                  title={currentUserId ? "Like" : "Sign in to like"}
                  onClick={() => toggleLike(c.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full border border-border/50 px-3 py-1.5 text-xs font-medium transition hover:bg-muted ${
                    currentUserId && c.likedBy?.includes(currentUserId)
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "text-muted-foreground"
                  } disabled:opacity-40`}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  {c.likedBy?.length ?? 0}
                </button>
                {canPost && (
                  <button
                    type="button"
                    className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                    onClick={() => setParentId(c.id)}
                  >
                    Reply
                  </button>
                )}
              </div>
              <ul className="mt-4 space-y-3 border-s-2 border-primary/20 ps-4">
                {byParent(c.id).map((r) => (
                  <li key={r.id}>
                    <p className="text-sm font-medium text-foreground">
                      {r.userName}
                    </p>
                    <div className="mt-1 text-sm text-muted-foreground">
                      <RichTextContent html={r.comment} variant="compact" />
                    </div>
                    <button
                      type="button"
                      disabled={!currentUserId}
                      onClick={() => toggleLike(r.id)}
                      className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${
                        currentUserId && r.likedBy?.includes(currentUserId)
                          ? "text-primary"
                          : "text-muted-foreground"
                      } disabled:opacity-40`}
                    >
                      <ThumbsUp className="h-3 w-3" />
                      {r.likedBy?.length ?? 0}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>

      <PaginationBar
        page={threadSafePage}
        pageSize={THREAD_PAGE_SIZE}
        total={rootTotal}
        onPageChange={setThreadPage}
        className="mt-6"
      />
    </section>
  );
}
