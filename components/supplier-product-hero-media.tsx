"use client";

import clsx from "clsx";
import {
  useCallback,
  useId,
  useRef,
  useState,
} from "react";
import {
  HiOutlineArrowUpTray,
  HiOutlineLink,
  HiOutlinePhoto,
  HiOutlineTrash,
} from "react-icons/hi2";
import {
  supplierInputClass,
  supplierLabelClass,
} from "@/components/supplier/form-styles";

type Props = {
  imageUrl: string;
  onImageUrlChange: (url: string) => void;
  urlInputId?: string;
};

export function SupplierProductHeroMedia({
  imageUrl,
  onImageUrlChange,
  urlInputId: urlInputIdProp,
}: Props) {
  const genId = useId();
  const fileId = `${genId}-file`;
  const urlId = urlInputIdProp ?? `${genId}-url`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [showUrl, setShowUrl] = useState(Boolean(imageUrl && /^https?:/i.test(imageUrl)));
  const [dragOver, setDragOver] = useState(false);

  const hasPreview = Boolean(imageUrl.trim());

  const applyUploadedUrl = useCallback(
    (url: string) => {
      onImageUrlChange(url);
      setUploadErr(null);
      setShowUrl(false);
    },
    [onImageUrlChange],
  );

  const uploadFile = useCallback(
    async (file: File) => {
      setUploading(true);
      setUploadErr(null);
      try {
        const fd = new FormData();
        fd.set("file", file);
        const res = await fetch("/api/products/upload-image", {
          method: "POST",
          body: fd,
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setUploadErr(
            typeof data.error === "string" ? data.error : "Upload failed.",
          );
          return;
        }
        const url = typeof data.url === "string" ? data.url : "";
        if (!url) {
          setUploadErr("Invalid response from server.");
          return;
        }
        applyUploadedUrl(url);
      } catch {
        setUploadErr("Upload failed. Check your connection.");
      } finally {
        setUploading(false);
      }
    },
    [applyUploadedUrl],
  );

  const onPickFiles = useCallback(
    (files: FileList | null) => {
      const f = files?.[0];
      if (f) void uploadFile(f);
    },
    [uploadFile],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      onPickFiles(e.dataTransfer.files);
    },
    [onPickFiles],
  );

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDragOver(false);
          }
        }}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={clsx(
          "group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed transition",
          dragOver
            ? "border-primary bg-primary/[0.06] ring-2 ring-primary/25"
            : "border-base-300 bg-gradient-to-br from-base-200/40 to-base-100 hover:border-primary/50 hover:bg-primary/[0.03]",
        )}
      >
        <input
          ref={inputRef}
          id={fileId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          aria-label="Upload product image"
          onChange={(e) => {
            onPickFiles(e.target.files);
            e.target.value = "";
          }}
          disabled={uploading}
        />

        <div className="flex min-h-[11rem] flex-col items-center justify-center gap-3 px-4 py-8 sm:min-h-[12rem] sm:flex-row sm:gap-6 sm:px-8">
          <div
            className={clsx(
              "relative flex aspect-[4/3] w-full max-w-[14rem] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-base-300/80 bg-base-100 shadow-inner sm:aspect-square sm:max-w-[10.5rem]",
              !hasPreview && "border-dashed",
            )}
          >
            {hasPreview ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-base-content/50 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
              </>
            ) : (
              <HiOutlinePhoto className="h-14 w-14 text-base-content/25" />
            )}
          </div>

          <div className="max-w-md flex-1 text-center sm:text-left">
            <p className="text-sm font-semibold text-base-content">
              {uploading ? "Uploading…" : "Drop an image here or click to browse"}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-base-content/60">
              JPG, PNG, or WebP · up to 5MB · shown as the main catalog photo
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                <HiOutlineArrowUpTray className="h-3.5 w-3.5" />
                Upload from device
              </span>
            </div>
          </div>
        </div>
      </div>

      {uploadErr ? (
        <p className="text-sm text-error" role="alert">
          {uploadErr}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 rounded-xl border border-base-300/80 bg-base-200/20 p-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowUrl((v) => !v);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-base-300 bg-base-100 px-4 py-2.5 text-sm font-medium text-base-content transition hover:bg-base-200"
        >
          <HiOutlineLink className="h-4 w-4 text-primary" />
          {showUrl ? "Hide image link" : "Use image URL instead"}
        </button>
        {hasPreview ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onImageUrlChange("");
              setUploadErr(null);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-error/30 bg-error/5 px-4 py-2.5 text-sm font-medium text-error transition hover:bg-error/10"
          >
            <HiOutlineTrash className="h-4 w-4" />
            Remove image
          </button>
        ) : null}
      </div>

      {showUrl ? (
        <label className={supplierLabelClass} htmlFor={urlId}>
          Image URL
          <input
            id={urlId}
            type="url"
            inputMode="url"
            placeholder="https://example.com/photo.jpg"
            value={imageUrl}
            onChange={(e) => onImageUrlChange(e.target.value)}
            className={supplierInputClass}
            autoComplete="off"
          />
          <span className="text-[11px] font-normal normal-case tracking-normal text-base-content/50">
            Optional if you already uploaded above. Must be a direct link to an image.
          </span>
        </label>
      ) : null}
    </div>
  );
}
