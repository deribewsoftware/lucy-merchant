import DOMPurify from "isomorphic-dompurify";

/** Tags produced by `RichTextEditor` — keep in sync with Tiptap extensions. */
export const RICH_TEXT_PURIFY = {
  ALLOWED_TAGS: [
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
  ],
  ALLOWED_ATTR: ["href", "target", "rel", "class"],
  ALLOW_DATA_ATTR: false,
} as const satisfies Parameters<typeof DOMPurify.sanitize>[1];

export function sanitizeRichHtml(html: string): string {
  return DOMPurify.sanitize(html ?? "", RICH_TEXT_PURIFY);
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
