"use client";

import { useCallback, useEffect, useState } from "react";
import { HiChatBubbleLeftRight, HiHandThumbUp } from "react-icons/hi2";
import type { ProductComment } from "@/lib/domain/types";

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
    if (!canPost || !text.trim()) return;
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

  const roots = comments.filter((c) => !c.parentId);
  const byParent = (pid: string) =>
    comments.filter((c) => c.parentId === pid);

  async function toggleLike(commentId: string) {
    if (!currentUserId) return;
    const res = await fetch(
      `/api/products/${productId}/comments/${commentId}/like`,
      { method: "POST" },
    );
    if (res.ok) await load();
  }

  return (
    <section className="mt-12 border-t border-base-300 pt-10">
      <div className="flex items-center gap-2">
        <HiChatBubbleLeftRight className="h-6 w-6 text-secondary" />
        <h2 className="text-xl font-bold sm:text-2xl">Product comments</h2>
      </div>
      <p className="mt-1 text-sm text-base-content/65">
        Threaded replies and likes. Sign in to react with a thumbs up.
      </p>

      {canPost && (
        <form onSubmit={submit} className="card mt-6 border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body gap-3 p-4 sm:p-6">
            {parentId && (
              <p className="text-xs text-base-content/60">
                Replying in thread —{" "}
                <button
                  type="button"
                  className="link link-primary"
                  onClick={() => setParentId(null)}
                >
                  cancel
                </button>
              </p>
            )}
            <textarea
              required
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ask a question or leave a note…"
              className="textarea textarea-bordered w-full"
            />
            {error && (
              <div role="alert" className="alert alert-error text-sm">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full sm:w-auto"
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm" />
              ) : null}
              {loading ? "Posting…" : "Post comment"}
            </button>
          </div>
        </form>
      )}
      {!canPost && (
        <div className="alert alert-info mt-4">
          <span className="text-sm">
            <a href="/login" className="link font-semibold">
              Sign in
            </a>{" "}
            as merchant or supplier to comment.
          </span>
        </div>
      )}

      <ul className="mt-8 space-y-4">
        {roots.length === 0 && (
          <li className="text-sm text-base-content/50">No comments yet.</li>
        )}
        {roots.map((c) => (
          <li
            key={c.id}
            className="card border border-base-300 bg-base-100 shadow-sm"
          >
            <div className="card-body p-4 sm:p-5">
              <p className="font-semibold">{c.userName}</p>
              <time
                className="text-xs text-base-content/50"
                dateTime={c.createdAt}
              >
                {new Date(c.createdAt).toLocaleString()}
              </time>
              <p className="mt-2 text-sm leading-relaxed text-base-content/85">
                {c.comment}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={!currentUserId}
                  title={currentUserId ? "Toggle like" : "Sign in to like"}
                  onClick={() => toggleLike(c.id)}
                  className={`btn btn-ghost btn-xs gap-1 ${
                    currentUserId && c.likedBy?.includes(currentUserId)
                      ? "text-primary"
                      : ""
                  }`}
                >
                  <HiHandThumbUp className="h-4 w-4" />
                  {c.likedBy?.length ?? 0}
                </button>
                {canPost && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs w-fit px-0"
                    onClick={() => setParentId(c.id)}
                  >
                    Reply
                  </button>
                )}
              </div>
              <ul className="mt-3 space-y-3 border-s-2 border-base-300 ps-4">
                {byParent(c.id).map((r) => (
                  <li key={r.id}>
                    <p className="text-sm font-medium">{r.userName}</p>
                    <p className="text-sm text-base-content/75">{r.comment}</p>
                    <button
                      type="button"
                      disabled={!currentUserId}
                      onClick={() => toggleLike(r.id)}
                      className={`btn btn-ghost btn-xs mt-1 gap-1 ${
                        currentUserId && r.likedBy?.includes(currentUserId)
                          ? "text-primary"
                          : ""
                      }`}
                    >
                      <HiHandThumbUp className="h-3.5 w-3.5" />
                      {r.likedBy?.length ?? 0}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
