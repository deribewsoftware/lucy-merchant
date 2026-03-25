"use client";

import clsx from "clsx";
import { Eye, EyeOff, KeyRound, Mail, type LucideIcon } from "lucide-react";
import { useId, useState, type InputHTMLAttributes } from "react";

const leadingIconWrap =
  "pointer-events-none absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg bg-gradient-to-br from-primary/12 to-primary/6 text-primary shadow-sm ring-1 ring-primary/15";

function IconMail() {
  return (
    <Mail className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden />
  );
}

function IconKey() {
  return (
    <KeyRound className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden />
  );
}

type AuthLeadingIconInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & {
  Icon: LucideIcon;
  inputClassName?: string;
  className?: string;
};

/** Shared leading-icon treatment for auth forms (e.g. name on register). */
export function AuthLeadingIconInput({
  Icon,
  className,
  inputClassName,
  id,
  ...rest
}: AuthLeadingIconInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className={clsx("relative", className)}>
      <span className={leadingIconWrap}>
        <Icon className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden />
      </span>
      <input
        id={inputId}
        className={clsx(
          "lm-input pl-[3.25rem] pr-4 transition-[box-shadow,border-color]",
          inputClassName,
        )}
        {...rest}
      />
    </div>
  );
}

type AuthEmailInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  inputClassName?: string;
};

export function AuthEmailInput({ className, inputClassName, id, ...rest }: AuthEmailInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className={clsx("relative", className)}>
      <span className={leadingIconWrap}>
        <IconMail />
      </span>
      <input
        id={inputId}
        type="email"
        autoComplete="email"
        className={clsx(
          "lm-input pl-[3.25rem] pr-4 transition-[box-shadow,border-color]",
          inputClassName,
        )}
        {...rest}
      />
    </div>
  );
}

type AuthPasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  inputClassName?: string;
  toggleLabels?: { show: string; hide: string };
};

export function AuthPasswordInput({
  className,
  inputClassName,
  id,
  toggleLabels = { show: "Show password", hide: "Hide password" },
  autoComplete = "current-password",
  ...rest
}: AuthPasswordInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const toggleId = `${inputId}-visibility`;
  const [visible, setVisible] = useState(false);

  return (
    <div className={clsx("relative", className)}>
      <span className={leadingIconWrap}>
        <IconKey />
      </span>
      <input
        id={inputId}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        className={clsx(
          "lm-input pl-[3.25rem] pr-12 transition-[box-shadow,border-color]",
          inputClassName,
        )}
        {...rest}
      />
      <button
        type="button"
        id={toggleId}
        aria-controls={inputId}
        aria-expanded={visible}
        aria-label={visible ? toggleLabels.hide : toggleLabels.show}
        onClick={() => setVisible((v) => !v)}
        className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        {visible ? (
          <EyeOff className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden />
        ) : (
          <Eye className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden />
        )}
      </button>
    </div>
  );
}
