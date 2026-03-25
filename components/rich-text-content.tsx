import clsx from "clsx";
import { isRichTextEmpty, sanitizeRichHtml } from "@/lib/rich-text";

type Props = {
  html: string;
  className?: string;
  /** Typography preset for long-form vs. compact snippets */
  variant?: "body" | "muted" | "compact" | "baseMuted";
};

const variantClass: Record<NonNullable<Props["variant"]>, string> = {
  body: "text-base leading-relaxed text-muted-foreground",
  muted: "text-base leading-relaxed text-muted-foreground sm:text-[1.05rem]",
  compact: "text-sm leading-snug text-muted-foreground",
  /** Matches `.lm-body-muted` for DaisyUI pages */
  baseMuted: "text-[0.9375rem] leading-[1.6] text-base-content/70",
};

/**
 * Renders sanitized HTML from the Tiptap-based editor (safe for RSC and client).
 */
export function RichTextContent({
  html,
  className,
  variant = "body",
}: Props) {
  if (isRichTextEmpty(html)) return null;
  const safe = sanitizeRichHtml(html);
  if (isRichTextEmpty(safe)) return null;
  return (
    <div
      className={clsx(
        "lm-rich-text min-w-0 max-w-none [&_a]:break-words [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
        variantClass[variant],
        className,
      )}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
