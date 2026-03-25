"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

export type CommissionReceiptTone = "primary" | "accent" | "amber" | "violet";

type Props = {
  tone: CommissionReceiptTone;
  /** Called when user selects or clears a file */
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
};

function resolveTone(t: CommissionReceiptTone): "primary" | "accent" {
  if (t === "amber" || t === "primary") return "primary";
  return "accent";
}

export function CommissionReceiptUpload({
  tone,
  onFileChange,
  disabled,
}: Props) {
  const variant = resolveTone(tone);
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (preview) URL.revokeObjectURL(preview);
    if (!f) {
      setPreview(null);
      setName(null);
      onFileChange(null);
      return;
    }
    setName(f.name);
    setPreview(URL.createObjectURL(f));
    onFileChange(f);
  }

  function clear() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setName(null);
    onFileChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const box =
    variant === "primary"
      ? "border-primary/30 bg-primary/[0.04] ring-primary/12"
      : "border-accent/35 bg-accent/[0.06] ring-accent/15";

  return (
    <div className={`rounded-lg border p-2 ring-1 ${box}`}>
      <p
        className={
          variant === "primary"
            ? "text-[10px] font-semibold uppercase tracking-wider text-primary"
            : "text-[10px] font-semibold uppercase tracking-wider text-accent"
        }
      >
        Payment proof
      </p>
      <p
        className={
          variant === "primary"
            ? "mt-0.5 text-xs text-muted-foreground"
            : "mt-0.5 text-xs text-base-content/65"
        }
      >
        Upload a screenshot or photo of your transfer receipt (JPG, PNG, WebP ·
        max 5MB). Required to confirm payment.
      </p>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        disabled={disabled}
        onChange={pick}
      />

      {!preview ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className={
            variant === "primary"
              ? "mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-primary/35 bg-background/60 py-4 text-sm font-medium text-foreground transition hover:bg-primary/10 disabled:opacity-50"
              : "mt-2 flex w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-accent/40 bg-base-100/80 py-4 text-sm font-medium text-base-content transition hover:bg-accent/10 disabled:opacity-50"
          }
        >
          <ImagePlus
            className={
              variant === "primary"
                ? "h-5 w-5 text-primary"
                : "h-5 w-5 text-accent"
            }
          />
          <span>Choose screenshot or receipt</span>
        </button>
      ) : (
        <div className="relative mt-2 overflow-hidden rounded-lg border border-border/50 bg-background/80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Payment receipt preview"
            className="max-h-32 w-full object-contain object-top"
          />
          <div className="flex items-center justify-between gap-2 border-t border-border/40 bg-muted/30 px-2 py-1.5 text-[11px] text-muted-foreground">
            <span className="min-w-0 truncate">{name}</span>
            <button
              type="button"
              onClick={clear}
              disabled={disabled}
              className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
            >
              <X className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
