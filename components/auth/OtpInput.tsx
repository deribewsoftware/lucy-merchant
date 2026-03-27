"use client";

import { useRef, useCallback, type KeyboardEvent, type ClipboardEvent } from "react";
import clsx from "clsx";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
  id?: string;
}

export default function OtpInput({
  length = 6,
  value,
  onChange,
  error = false,
  disabled = false,
  id = "otp",
}: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(length, "").split("").slice(0, length);

  const focusInput = useCallback(
    (idx: number) => {
      const clamped = Math.max(0, Math.min(idx, length - 1));
      inputsRef.current[clamped]?.focus();
    },
    [length],
  );

  const handleChange = useCallback(
    (idx: number, char: string) => {
      const digit = char.replace(/\D/g, "").slice(-1);
      if (!digit) return;
      const arr = digits.slice();
      arr[idx] = digit;
      onChange(arr.join(""));
      if (idx < length - 1) focusInput(idx + 1);
    },
    [digits, focusInput, length, onChange],
  );

  const handleKeyDown = useCallback(
    (idx: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        e.preventDefault();
        const arr = digits.slice();
        if (arr[idx]) {
          arr[idx] = "";
          onChange(arr.join(""));
        } else if (idx > 0) {
          arr[idx - 1] = "";
          onChange(arr.join(""));
          focusInput(idx - 1);
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        focusInput(idx - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        focusInput(idx + 1);
      }
    },
    [digits, focusInput, onChange],
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
      if (pasted.length > 0) {
        onChange(pasted.padEnd(length, "").slice(0, length).replace(/ /g, ""));
        focusInput(Math.min(pasted.length, length - 1));
      }
    },
    [focusInput, length, onChange],
  );

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3" role="group" aria-label="Verification code">
      {digits.map((digit, idx) => (
        <input
          key={idx}
          ref={(el) => { inputsRef.current[idx] = el; }}
          id={idx === 0 ? id : undefined}
          type="text"
          inputMode="numeric"
          autoComplete={idx === 0 ? "one-time-code" : "off"}
          maxLength={1}
          disabled={disabled}
          value={digit.trim()}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          aria-label={`Digit ${idx + 1}`}
          className={clsx(
            "h-14 w-11 rounded-xl border-2 bg-base-100 text-center font-mono text-xl font-semibold text-foreground transition-all duration-200 sm:h-16 sm:w-13 sm:text-2xl",
            "focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-base-100",
            error
              ? "border-error/60 focus:border-error focus:ring-error/25"
              : digit
                ? "border-primary/50 focus:border-primary focus:ring-primary/25"
                : "border-base-300/80 focus:border-primary focus:ring-primary/25",
            disabled && "cursor-not-allowed opacity-50",
          )}
        />
      ))}
    </div>
  );
}
