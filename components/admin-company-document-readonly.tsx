"use client";

import { useState } from "react";
import {
  HiOutlineArrowTopRightOnSquare,
  HiOutlineDocumentDuplicate,
  HiOutlinePhoto,
} from "react-icons/hi2";
import { isLikelyPdfUrl, isLikelyPublicImageUrl } from "@/lib/utils/document-url";

type Props = {
  label: string;
  value: string;
};

/**
 * Read-only preview for company document URLs (same behavior as supplier form preview).
 */
export function AdminCompanyDocumentReadonly({ label, value }: Props) {
  const [imgBroken, setImgBroken] = useState(false);
  const trimmed = value.trim();
  const showImage = isLikelyPublicImageUrl(trimmed) && !imgBroken;
  const showPdf = isLikelyPdfUrl(trimmed);
  const isHttp = /^https?:\/\//i.test(trimmed);
  const isUploadPath =
    trimmed.startsWith("/api/uploads/") || trimmed.startsWith("/uploads/");
  const isLinkLike = isHttp || isUploadPath;

  if (!trimmed) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
        {label}
      </p>
      {isLinkLike ? (
        <div className="overflow-hidden rounded-2xl border border-base-300/80 bg-gradient-to-br from-base-200/40 to-base-100 shadow-inner ring-1 ring-base-300/30">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-base-300/50 bg-base-200/30 px-3 py-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-base-content/55">
              {showImage ? (
                <>
                  <HiOutlinePhoto className="h-3.5 w-3.5 text-primary" />
                  Preview
                </>
              ) : showPdf ? (
                <>
                  <HiOutlineDocumentDuplicate className="h-3.5 w-3.5 text-secondary" />
                  PDF preview
                </>
              ) : (
                <>
                  <HiOutlineArrowTopRightOnSquare className="h-3.5 w-3.5 text-base-content/50" />
                  Linked resource
                </>
              )}
            </span>
            <a
              href={trimmed}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition hover:bg-primary/15"
            >
              Open
              <HiOutlineArrowTopRightOnSquare className="h-3.5 w-3.5" />
            </a>
          </div>
          <div className="relative min-h-[120px] p-3 sm:min-h-[140px] sm:p-4">
            {showImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin review of supplier URL
              <img
                src={trimmed}
                alt=""
                className="mx-auto max-h-[min(360px,55vh)] w-full rounded-lg object-contain shadow-md ring-1 ring-black/5"
                onError={() => setImgBroken(true)}
              />
            ) : showPdf ? (
              <div className="space-y-2">
                <iframe
                  title="PDF preview"
                  src={trimmed}
                  className="h-[min(420px,65vh)] w-full rounded-lg border border-base-300/70 bg-base-200/30 shadow-inner"
                />
                <p className="text-center text-[11px] leading-relaxed text-base-content/50">
                  If this area stays blank, the host may block embedding — use{" "}
                  <strong className="text-base-content/75">Open</strong> to view the PDF.
                </p>
              </div>
            ) : (
              <p className="py-4 text-center text-xs leading-relaxed text-base-content/55">
                Preview appears when the URL ends in{" "}
                <span className="font-mono text-[10px] text-base-content/70">.jpg, .png, .webp…</span>{" "}
                or use Open to check the link.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-base-300/80 bg-base-200/20 px-3 py-2.5">
          <p className="text-[11px] leading-relaxed text-base-content/55">
            <span className="font-medium text-base-content/70">Reference on file: </span>
            <span className="font-mono text-xs text-base-content/80">{trimmed}</span>
          </p>
        </div>
      )}
    </div>
  );
}
