"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  src: string;
  alt: string;
  /** Shown under the image (defaults to alt) */
  caption?: string;
};

/** Full-screen image preview: Esc, backdrop click, or close button. */
export function ImagePreviewLightbox({
  open,
  onClose,
  src,
  alt,
  caption,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const line = caption ?? alt;

  return (
    <div
      className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="btn btn-circle btn-sm absolute -top-1 right-0 z-10 border border-white/25 bg-base-100 text-base-content shadow-lg sm:-right-1 sm:-top-12"
          aria-label="Close preview"
          onClick={onClose}
        >
          <X className="h-4 w-4" strokeWidth={2.5} />
        </button>
        <div className="overflow-hidden rounded-2xl border border-white/15 bg-base-100 shadow-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="max-h-[min(85vh,920px)] w-full object-contain"
          />
        </div>
        {line ? (
          <p className="mt-3 text-center text-sm font-medium text-white/95 sm:text-base">
            {line}
          </p>
        ) : null}
        <p className="mt-1 text-center text-xs text-white/60">
          Click outside or press Esc to close
        </p>
      </div>
    </div>
  );
}
