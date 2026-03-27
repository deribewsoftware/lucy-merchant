"use client";

import clsx from "clsx";
import { HiOutlineEnvelope, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeSlash } from "react-icons/hi2";
import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import type { IconType } from "react-icons";

/* ── field shell (border + focus ring) ──────────────────────── */
function fieldShellClass(error?: boolean, success?: boolean) {
  return clsx(
    "flex min-h-[3rem] items-stretch overflow-hidden rounded-xl border transition-all duration-200",
    error
      ? "border-error/70 bg-error/[0.03] focus-within:border-error focus-within:ring-2 focus-within:ring-error/20 lm-auth-shake"
      : success
        ? "border-success/60 bg-success/[0.03] focus-within:border-success focus-within:ring-2 focus-within:ring-success/20"
        : "border-base-300/70 bg-base-100 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15 hover:border-base-300",
  );
}

/* ── icon column ────────────────────────────────────────────── */
function IconColumn({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-11 shrink-0 flex-col items-center justify-center border-r border-base-300/50 bg-muted/30 text-primary/80">
      {children}
    </div>
  );
}

/* ── Input Base Styles ── */
const inputBaseClasses =
  "h-full min-h-[3rem] w-full border-0 bg-transparent px-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60";

/* ================================================================
   AuthLeadingIconInput — leading icon + stacked label
   ================================================================ */
type AuthLeadingIconInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & {
  Icon: IconType;
  label: string;
  inputClassName?: string;
  className?: string;
  error?: boolean;
  success?: boolean;
};

export function AuthLeadingIconInput({
  Icon,
  label,
  className,
  inputClassName,
  id,
  error,
  success,
  ...rest
}: AuthLeadingIconInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className={clsx("flex w-full flex-col gap-1.5", className)}>
      <label htmlFor={inputId} className="ml-1 text-[13px] font-medium text-foreground/90">
        {label}
      </label>
      <div className={fieldShellClass(error, success)}>
        <IconColumn>
          <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
        </IconColumn>
        <div className="relative w-full min-w-0 flex-1">
          <input
            id={inputId}
            placeholder={rest.placeholder || `Enter your ${label.toLowerCase()}`}
            className={clsx(inputBaseClasses, inputClassName)}
            {...rest}
          />
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   AuthEmailInput — envelope icon + stacked label
   ================================================================ */
type AuthEmailInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
  inputClassName?: string;
  className?: string;
  error?: boolean;
  success?: boolean;
};

export function AuthEmailInput({
  className,
  inputClassName,
  id,
  label = "Email address",
  error,
  success,
  ...rest
}: AuthEmailInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className={clsx("flex w-full flex-col gap-1.5", className)}>
      <label htmlFor={inputId} className="ml-1 text-[13px] font-medium text-foreground/90">
        {label}
      </label>
      <div className={fieldShellClass(error, success)}>
        <IconColumn>
          <HiOutlineEnvelope className="h-[18px] w-[18px] shrink-0" aria-hidden />
        </IconColumn>
        <div className="relative w-full min-w-0 flex-1">
          <input
            id={inputId}
            type="email"
            autoComplete="email"
            placeholder={rest.placeholder || "Enter your email"}
            className={clsx(inputBaseClasses, inputClassName)}
            {...rest}
          />
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   AuthPasswordInput — lock icon + eye toggle + stacked label
   ================================================================ */
type AuthPasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
  inputClassName?: string;
  className?: string;
  toggleLabels?: { show: string; hide: string };
  error?: boolean;
  success?: boolean;
};

export function AuthPasswordInput({
  className,
  inputClassName,
  id,
  label = "Password",
  toggleLabels = { show: "Show password", hide: "Hide password" },
  autoComplete = "current-password",
  error,
  success,
  ...rest
}: AuthPasswordInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const toggleId = `${inputId}-visibility`;
  const [visible, setVisible] = useState(false);

  return (
    <div className={clsx("flex w-full flex-col gap-1.5", className)}>
      <label htmlFor={inputId} className="ml-1 text-[13px] font-medium text-foreground/90">
        {label}
      </label>
      <div className={fieldShellClass(error, success)}>
        <IconColumn>
          <HiOutlineLockClosed className="h-[18px] w-[18px] shrink-0" aria-hidden />
        </IconColumn>
        <div className="relative w-full min-w-0 flex-1">
          <input
            id={inputId}
            type={visible ? "text" : "password"}
            autoComplete={autoComplete}
            placeholder={rest.placeholder || "••••••••"}
            className={clsx(inputBaseClasses, "pr-1", inputClassName)}
            {...rest}
          />
        </div>
        <div className="flex w-11 shrink-0 items-center justify-center border-l border-base-300/50 bg-muted/20">
          <button
            type="button"
            id={toggleId}
            aria-controls={inputId}
            aria-expanded={visible}
            aria-label={visible ? toggleLabels.hide : toggleLabels.show}
            onClick={() => setVisible((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/90 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
          >
            {visible ? (
              <HiOutlineEyeSlash className="h-[18px] w-[18px]" aria-hidden />
            ) : (
              <HiOutlineEye className="h-[18px] w-[18px]" aria-hidden />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   AuthFloatingTextInput -> renamed conceptually but keeping name for compatibility
   ================================================================ */
export function AuthFloatingTextInput({
  label,
  className,
  inputClassName,
  id,
  error,
  success,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & {
  label: string;
  inputClassName?: string;
  className?: string;
  error?: boolean;
  success?: boolean;
}) {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <div className={clsx("flex w-full flex-col gap-1.5", className)}>
      <label htmlFor={inputId} className="ml-1 text-[13px] font-medium text-foreground/90">
        {label}
      </label>
      <div className={fieldShellClass(error, success)}>
        <div className="relative w-full min-w-0 flex-1">
          <input
            id={inputId}
            placeholder={rest.placeholder || `Enter ${label.toLowerCase()}`}
            className={clsx(inputBaseClasses, "px-4", inputClassName)}
            {...rest}
          />
        </div>
      </div>
    </div>
  );
}
