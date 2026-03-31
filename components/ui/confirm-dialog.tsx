"use client";

import clsx from "clsx";
import { AlertTriangle, CircleCheck, HelpCircle } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
  type MouseEvent,
} from "react";

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  /** Extra controls between description and error (e.g. text fields). */
  children?: ReactNode;
  /** Shown below the description (e.g. API error after confirm). */
  errorMessage?: string | null;
  confirmLabel?: string;
  cancelLabel?: string;
  /** danger = destructive; primary = strong affirmative; neutral = standard */
  variant?: "danger" | "primary" | "neutral";
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  errorMessage,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "neutral",
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();
  const errorId = useId();

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      if (!el.open) el.showModal();
    } else if (el.open) {
      el.close();
    }
  }, [open]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const onClose = () => {
      if (!el.open) onOpenChange(false);
    };
    el.addEventListener("close", onClose);
    return () => el.removeEventListener("close", onClose);
  }, [onOpenChange]);

  function onBackdropClick(e: MouseEvent<HTMLDialogElement>) {
    if (e.target === e.currentTarget) onOpenChange(false);
  }

  async function handleConfirm() {
    await onConfirm();
  }

  const Icon =
    variant === "danger" ? (
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-error/12 text-error ring-1 ring-error/25">
        <AlertTriangle className="h-7 w-7" strokeWidth={2} aria-hidden />
      </span>
    ) : variant === "primary" ? (
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success/12 text-success ring-1 ring-success/25">
        <CircleCheck className="h-7 w-7" strokeWidth={2} aria-hidden />
      </span>
    ) : (
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/25">
        <HelpCircle className="h-7 w-7" strokeWidth={2} aria-hidden />
      </span>
    );

  const confirmBtnClass =
    variant === "danger"
      ? "btn btn-error gap-2 shadow-lg shadow-error/20"
      : variant === "primary"
        ? "btn btn-primary gap-2 shadow-lg shadow-primary/20"
        : "btn btn-primary gap-2";

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby={titleId}
      aria-describedby={
        [description && descId, errorMessage && errorId]
          .filter(Boolean)
          .join(" ") || undefined
      }
      onClick={onBackdropClick}
    >
      <div
        className="modal-box relative max-w-md overflow-hidden border border-base-300/40 p-0 shadow-2xl ring-1 ring-base-content/5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-br from-primary/[0.07] via-base-100 to-accent/[0.06] px-6 pb-2 pt-7">
          <div className="flex flex-col items-center text-center">
            {Icon}
            <h2
              id={titleId}
              className="mt-4 text-balance text-lg font-bold tracking-tight text-base-content"
            >
              {title}
            </h2>
          </div>
        </div>

        {description ? (
          <div
            id={descId}
            className="border-t border-base-300/30 bg-base-100/80 px-6 py-4 text-center text-sm leading-relaxed text-base-content/75"
          >
            {description}
          </div>
        ) : null}

        {children ? (
          <div className="border-t border-base-300/30 bg-base-100 px-6 py-4 text-left text-sm text-base-content/85">
            {children}
          </div>
        ) : null}

        {errorMessage ? (
          <div
            id={errorId}
            role="alert"
            className="border-t border-error/20 bg-error/10 px-6 py-3 text-center text-sm text-error"
          >
            {errorMessage}
          </div>
        ) : null}

        <div className="modal-action flex-wrap gap-2 border-t border-base-300/30 bg-base-200/20 px-6 py-4">
          <button
            type="button"
            className={clsx(
              "btn btn-ghost btn-sm font-medium text-base-content/80",
              "hover:bg-base-300/40",
            )}
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={clsx(confirmBtnClass, "btn-sm min-w-[7.5rem]")}
            disabled={loading}
            onClick={() => void handleConfirm()}
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm" />
            ) : null}
            {loading ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
