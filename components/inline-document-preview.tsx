"use client";

import { isLikelyPdfUrl, isLikelyPublicImageUrl } from "@/lib/utils/document-url";

type Props = {
  url: string;
  /** e.g. "h-48" for shorter admin cards */
  iframeClassName?: string;
};

/**
 * Inline image, PDF iframe, or link for uploaded / HTTPS document URLs.
 */
export function InlineDocumentPreview({ url, iframeClassName }: Props) {
  const t = url.trim();
  if (!t) return null;

  const isLink =
    /^https?:\/\//i.test(t) ||
    t.startsWith("/api/uploads/") ||
    t.startsWith("/uploads/");

  if (!isLink) {
    return (
      <p className="rounded-lg border border-dashed border-base-300 bg-base-200/20 px-2 py-1.5 font-mono text-xs text-base-content/80">
        {t}
      </p>
    );
  }

  if (isLikelyPublicImageUrl(t)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- admin review of supplier URLs
      <img
        src={t}
        alt=""
        className="max-h-[min(280px,40vh)] w-full rounded-lg border border-base-300/60 bg-base-200/30 object-contain"
      />
    );
  }

  if (isLikelyPdfUrl(t)) {
    return (
      <div className="space-y-1">
        <iframe
          title="PDF preview"
          src={t}
          className={
            iframeClassName ??
            "h-56 w-full rounded-lg border border-base-300/60 bg-base-200/20"
          }
        />
        <p className="text-[10px] text-base-content/45">
          If empty, open in a new tab — some hosts block embedded PDFs.
        </p>
      </div>
    );
  }

  return (
    <a
      href={t}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex text-sm font-medium text-primary underline-offset-2 hover:underline"
    >
      Open document
    </a>
  );
}
