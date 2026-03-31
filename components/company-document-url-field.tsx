"use client";

import { useState } from "react";
import {
  HiOutlineArrowTopRightOnSquare,
  HiOutlineArrowUpTray,
  HiOutlineDocumentDuplicate,
  HiOutlinePhoto,
  HiOutlineXMark,
} from "react-icons/hi2";
import { isLikelyPdfUrl, isLikelyPublicImageUrl } from "@/lib/utils/document-url";

type Props = {
  id?: string;
  label: string;
  description: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  inputType?: "url" | "text";
  /** Upload to server — URL is filled automatically (JPG/PNG/WebP/PDF). */
  enableUpload?: boolean;
};

/**
 * URL or text reference field with optional live preview for image links
 * and a clear action row for PDFs / external pages.
 */
export function CompanyDocumentUrlField({
  id,
  label,
  description,
  value,
  onChange,
  placeholder,
  inputType = "url",
  enableUpload = false,
}: Props) {
  const [imgBroken, setImgBroken] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const trimmed = value.trim();
  const showImage =
    isLikelyPublicImageUrl(trimmed) && !imgBroken;
  const showPdf = isLikelyPdfUrl(trimmed);
  const isHttp = /^https?:\/\//i.test(trimmed);
  const isUploadPath =
    trimmed.startsWith("/api/uploads/") || trimmed.startsWith("/uploads/");
  const isLinkLike = isHttp || isUploadPath;

  async function uploadFile(file: File | null) {
    if (!file) return;
    setUploadErr(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/companies/upload-document", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; url?: string };
      if (!res.ok) {
        setUploadErr(data.error ?? "Upload failed");
        return;
      }
      if (data.url) {
        setImgBroken(false);
        onChange(data.url);
      }
    } catch {
      setUploadErr("Upload failed. Check your connection.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
          {label}
        </span>
        <span className="text-[11px] font-normal normal-case tracking-normal text-base-content/45">
          {description}
        </span>
      </label>
      <input
        id={id}
        type={inputType === "url" ? "url" : "text"}
        inputMode={inputType === "url" ? "url" : undefined}
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          setImgBroken(false);
          onChange(e.target.value);
        }}
        className="mt-1 w-full rounded-xl border border-base-300 bg-base-100 px-3.5 py-2.5 text-sm text-base-content shadow-sm outline-none transition placeholder:text-base-content/40 focus:border-primary focus:ring-2 focus:ring-primary/20"
      />

      {enableUpload ? (
        <div className="mt-3 rounded-xl border border-dashed border-primary/30 bg-primary/[0.04] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-base-content/50">
            Or upload a file
          </p>
          <p className="mt-1 text-[11px] text-base-content/45">
            Images up to 5MB · PDF up to 12MB. Stored on this app — the link appears above.
          </p>
          <label className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/25 bg-base-100 py-6 transition hover:border-primary/40 hover:bg-base-200/40 sm:flex-row sm:justify-start sm:px-4">
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                void uploadFile(f);
                e.target.value = "";
              }}
            />
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
              {uploading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                <HiOutlineArrowUpTray className="h-5 w-5" />
              )}
            </span>
            <div className="text-center sm:text-left">
              <p className="text-sm font-semibold text-base-content">
                {uploading ? "Uploading…" : "Choose image or PDF"}
              </p>
              <p className="text-[11px] text-base-content/45">JPG, PNG, WebP, or PDF</p>
            </div>
          </label>
          {uploadErr ? (
            <p className="mt-2 text-xs text-error" role="alert">
              {uploadErr}
            </p>
          ) : null}
        </div>
      ) : null}

      {trimmed && isLinkLike ? (
        <div className="mt-3 overflow-hidden rounded-2xl border border-base-300/80 bg-gradient-to-br from-base-200/40 to-base-100 shadow-inner ring-1 ring-base-300/30">
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
              // eslint-disable-next-line @next/next/no-img-element -- user-supplied document URL
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
      ) : trimmed && !isLinkLike ? (
        <div className="mt-2 rounded-xl border border-dashed border-base-300/80 bg-base-200/20 px-3 py-2.5">
          <p className="text-[11px] leading-relaxed text-base-content/55">
            <span className="font-medium text-base-content/70">Reference on file: </span>
            <span className="font-mono text-xs text-base-content/80">{trimmed}</span>
          </p>
        </div>
      ) : null}
    </div>
  );
}

/** Compact clear control for optional URL fields */
export function ClearFieldButton({
  show,
  onClear,
  label,
}: {
  show: boolean;
  onClear: () => void;
  label: string;
}) {
  if (!show) return null;
  return (
    <button
      type="button"
      onClick={onClear}
      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-base-content/50 transition hover:bg-base-200 hover:text-base-content"
      aria-label={label}
    >
      <HiOutlineXMark className="h-3.5 w-3.5" />
      Clear
    </button>
  );
}
