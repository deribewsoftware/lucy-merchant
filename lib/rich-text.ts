import sanitizeHtml from "sanitize-html";

/** Tags produced by `RichTextEditor` — keep in sync with Tiptap extensions. */
export const RICH_TEXT_ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "strike",
  "del",
  "blockquote",
  "ul",
  "ol",
  "li",
  "a",
  "h2",
  "h3",
  "hr",
] as const;

const SANITIZE_OPTIONS: NonNullable<Parameters<typeof sanitizeHtml>[1]> = {
  allowedTags: [...RICH_TEXT_ALLOWED_TAGS],
  allowedAttributes: {
    a: ["href", "target", "rel", "class"],
    "*": ["class"],
  },
  /** Block javascript: and data: in href */
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: {
    a: ["http", "https", "mailto", "tel"],
  },
};

/** @deprecated Use `RICH_TEXT_ALLOWED_TAGS` / `sanitizeRichHtml` — kept for any legacy imports */
export const RICH_TEXT_PURIFY = {
  ALLOWED_TAGS: RICH_TEXT_ALLOWED_TAGS,
  ALLOWED_ATTR: ["href", "target", "rel", "class"],
  ALLOW_DATA_ATTR: false,
} as const;

export function sanitizeRichHtml(html: string): string {
  return sanitizeHtml(html ?? "", SANITIZE_OPTIONS);
}

export function stripHtmlToPlainText(html: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isRichTextEmpty(html: string): boolean {
  return stripHtmlToPlainText(html).length === 0;
}
