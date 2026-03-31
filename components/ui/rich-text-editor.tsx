"use client";

import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import clsx from "clsx";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  Link2Off,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type MouseEvent,
} from "react";
import { isRichTextEmpty } from "@/lib/rich-text";

export type RichTextEditorVariant = "default" | "supplier" | "zinc";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  /** Minimum height of the typing area (Tailwind min-h-* or any CSS length) */
  editorMinHeightClass?: string;
  disabled?: boolean;
  variant?: RichTextEditorVariant;
  id?: string;
  "aria-label"?: string;
};

const shellClass: Record<RichTextEditorVariant, string> = {
  default:
    "rounded-2xl border border-base-300/70 bg-gradient-to-b from-base-100 to-base-200/25 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)] ring-1 ring-base-content/[0.04] transition-[box-shadow,border-color] focus-within:border-primary/55 focus-within:shadow-[0_4px_20px_-4px_color-mix(in_oklch,var(--color-primary)_25%,transparent)] focus-within:ring-primary/15 dark:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.35)]",
  supplier:
    "rounded-2xl border border-base-300/80 bg-gradient-to-b from-base-100 to-primary/[0.04] shadow-[0_2px_10px_-2px_rgba(0,0,0,0.07)] ring-1 ring-base-content/[0.05] transition-[box-shadow,border-color] focus-within:border-primary focus-within:shadow-[0_4px_24px_-6px_color-mix(in_oklch,var(--color-primary)_30%,transparent)] focus-within:ring-2 focus-within:ring-primary/18",
  zinc:
    "rounded-2xl border border-zinc-200/90 bg-gradient-to-b from-white to-zinc-50/90 shadow-sm ring-1 ring-zinc-900/[0.04] transition-[box-shadow,border-color] focus-within:border-zinc-400 focus-within:ring-2 focus-within:ring-zinc-400/20 dark:border-zinc-700 dark:from-zinc-950 dark:to-zinc-900/80 dark:ring-white/[0.06] dark:focus-within:border-zinc-500 dark:focus-within:ring-zinc-500/25",
};

const toolbarWrapClass: Record<RichTextEditorVariant, string> = {
  default:
    "border-b border-base-300/55 bg-gradient-to-b from-base-200/50 to-base-200/25 px-2 py-2 sm:px-3",
  supplier:
    "border-b border-base-300/65 bg-gradient-to-b from-base-200/55 to-base-200/30 px-2 py-2 sm:px-3.5",
  zinc:
    "border-b border-zinc-200/90 bg-gradient-to-b from-zinc-100/90 to-zinc-100/40 px-2 py-2 dark:border-zinc-700 dark:from-zinc-900/70 dark:to-zinc-900/35 sm:px-3",
};

const editorAreaClass: Record<RichTextEditorVariant, string> = {
  default: "px-3 py-3 text-sm text-base-content sm:px-4 sm:py-3.5",
  supplier: "px-3.5 py-3 text-sm text-base-content sm:px-4 sm:py-3.5",
  zinc:
    "px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 sm:px-4 sm:py-3",
};

function ToolbarGroup({
  label,
  variant,
  children,
}: {
  label: string;
  variant: RichTextEditorVariant;
  children: ReactNode;
}) {
  return (
    <div
      className={clsx(
        "flex shrink-0 flex-wrap items-center gap-0.5 rounded-xl p-1 shadow-inner",
        variant === "zinc"
          ? "bg-zinc-200/50 ring-1 ring-zinc-300/60 dark:bg-zinc-950/50 dark:ring-zinc-700/70"
          : "bg-base-300/35 ring-1 ring-base-300/50 dark:bg-base-300/25",
      )}
      role="group"
      aria-label={label}
    >
      {children}
    </div>
  );
}

function ToolbarButton({
  pressed,
  disabled,
  onClick,
  label,
  children,
  variant,
}: {
  pressed?: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
  variant: RichTextEditorVariant;
}) {
  const base = clsx(
    "inline-flex h-8 min-w-[2rem] shrink-0 items-center justify-center rounded-lg text-sm transition-[background,color,transform,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-35 sm:h-8 sm:min-w-[2.25rem]",
    variant === "zinc"
      ? "focus-visible:ring-zinc-500/45 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950"
      : "focus-visible:ring-primary/40 focus-visible:ring-offset-1 focus-visible:ring-offset-base-100 dark:focus-visible:ring-offset-base-200",
  );
  const theme =
    variant === "zinc"
      ? pressed
        ? "bg-zinc-300/90 text-zinc-950 shadow-sm dark:bg-zinc-600 dark:text-zinc-50"
        : "text-zinc-700 hover:bg-zinc-300/70 dark:text-zinc-300 dark:hover:bg-zinc-800"
      : pressed
        ? "bg-primary/18 text-primary shadow-sm ring-1 ring-primary/20"
        : "text-base-content/80 hover:bg-base-300/65 hover:text-base-content";
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={clsx(base, theme)}
    >
      {children}
    </button>
  );
}

function LinkUrlDialog({
  open,
  onOpenChange,
  initialUrl,
  variant,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialUrl: string;
  variant: RichTextEditorVariant;
  onApply: (url: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const urlFieldId = useId();
  const [draft, setDraft] = useState(initialUrl);

  useEffect(() => {
    if (open) setDraft(initialUrl);
  }, [open, initialUrl]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      if (!el.open) el.showModal();
      queueMicrotask(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
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

  function submit() {
    onApply(draft.trim());
    onOpenChange(false);
  }

  const inputClass =
    variant === "zinc"
      ? "input input-bordered w-full normal-case border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-zinc-500/20 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
      : "input input-bordered w-full normal-case border-base-300 bg-base-100 text-base-content placeholder:text-base-content/45 focus:border-primary/70";

  return (
    <dialog
      ref={dialogRef}
      className="modal normal-case"
      aria-labelledby={titleId}
      onClick={onBackdropClick}
    >
      <div
        className="modal-box max-w-md border border-base-300/50 p-0 shadow-2xl ring-1 ring-base-content/5 normal-case"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={clsx(
            "border-b border-base-300/40 px-5 py-4",
            variant === "zinc"
              ? "bg-gradient-to-br from-zinc-100/90 to-white dark:from-zinc-900 dark:to-zinc-950"
              : "bg-gradient-to-br from-primary/[0.08] via-base-100 to-accent/[0.06]",
          )}
        >
          <h2
            id={titleId}
            className="text-lg font-semibold tracking-tight text-base-content"
          >
            Insert link
          </h2>
          <p className="mt-1 text-sm text-base-content/65">
            Paste a full URL (https://…). Leave empty and apply to remove the
            link from the selection.
          </p>
        </div>
        <div className="px-5 py-4">
          <label className="sr-only" htmlFor={urlFieldId}>
            Link URL
          </label>
          <input
            ref={inputRef}
            id={urlFieldId}
            type="url"
            autoComplete="url"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            className={inputClass}
            placeholder="https://example.com"
          />
        </div>
        <div className="modal-action flex-wrap gap-2 border-t border-base-300/35 bg-base-200/15 px-5 py-3">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm min-w-[5.5rem]"
            onClick={submit}
          >
            Apply
          </button>
        </div>
      </div>
    </dialog>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write something…",
  className,
  editorMinHeightClass = "min-h-[7.5rem]",
  disabled = false,
  variant = "default",
  id,
  "aria-label": ariaLabel,
}: Props) {
  const onChangeRef = useRef(onChange);
  // Single-arg effect keeps React 19 happy (same signature every render; never pass deps here).
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const [linkOpen, setLinkOpen] = useState(false);
  const [linkDraft, setLinkDraft] = useState("https://");

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          heading: { levels: [2, 3] },
        }),
        Underline,
        LinkExtension.configure({
          openOnClick: false,
          HTMLAttributes: {
            class:
              "text-primary underline underline-offset-2 break-words hover:opacity-90",
            rel: "noopener noreferrer nofollow",
            target: "_blank",
          },
        }),
        Placeholder.configure({ placeholder }),
      ],
      content: value || "",
      editable: !disabled,
      editorProps: {
        attributes: {
          class: clsx(
            "lm-rich-text prose prose-sm max-w-none normal-case outline-none sm:prose-base",
            editorMinHeightClass,
            "px-0 py-0",
          ),
          "aria-label": ariaLabel ?? placeholder,
          ...(id ? { id } : {}),
        },
      },
      onUpdate: ({ editor: ed }) => {
        onChangeRef.current(ed.getHTML());
      },
    },
    [],
  );

  useEffect(() => {
    if (!editor) return;
    const cur = editor.getHTML();
    if (isRichTextEmpty(value) && isRichTextEmpty(cur)) return;
    if (value === cur) return;
    editor.commands.setContent(value || "", { emitUpdate: false });
  }, [value, editor]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  function openLinkDialog() {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    setLinkDraft(prev?.trim() ? prev : "https://");
    setLinkOpen(true);
  }

  function applyLink(url: string) {
    if (!editor) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  if (!editor) {
    return (
      <div
        className={clsx(
          shellClass[variant],
          "normal-case overflow-hidden",
          className,
        )}
        data-rich-variant={variant}
        aria-busy
        aria-label={ariaLabel ?? placeholder}
      >
        <div className={toolbarWrapClass[variant]}>
          <div className="flex animate-pulse flex-wrap gap-2">
            <div className="h-9 flex-1 min-w-[12rem] rounded-xl bg-base-300/50 dark:bg-base-300/30" />
            <div className="h-9 w-24 rounded-xl bg-base-300/40 dark:bg-base-300/25" />
          </div>
        </div>
        <div
          className={clsx(
            editorAreaClass[variant],
            "lm-rich-editor",
            editorMinHeightClass,
            "animate-pulse bg-base-200/20",
          )}
        />
      </div>
    );
  }

  const ed = editor;

  return (
    <div
      className={clsx(
        shellClass[variant],
        "normal-case overflow-hidden",
        disabled && "pointer-events-none opacity-[0.62]",
        className,
      )}
      data-rich-variant={variant}
    >
      <LinkUrlDialog
        open={linkOpen}
        onOpenChange={setLinkOpen}
        initialUrl={linkDraft}
        variant={variant}
        onApply={applyLink}
      />

      <div className={toolbarWrapClass[variant]}>
        <div
          role="toolbar"
          aria-label="Text formatting"
          className="flex flex-wrap items-center gap-2 sm:gap-2.5 lg:overflow-visible"
        >
          <ToolbarGroup label="Text style" variant={variant}>
            <ToolbarButton
              variant={variant}
              label="Bold"
              pressed={ed.isActive("bold")}
              disabled={!ed.can().toggleBold()}
              onClick={() => ed.chain().focus().toggleBold().run()}
            >
              <Bold className="h-4 w-4" strokeWidth={2} />
            </ToolbarButton>
            <ToolbarButton
              variant={variant}
              label="Italic"
              pressed={ed.isActive("italic")}
              disabled={!ed.can().toggleItalic()}
              onClick={() => ed.chain().focus().toggleItalic().run()}
            >
              <Italic className="h-4 w-4" strokeWidth={2} />
            </ToolbarButton>
            <ToolbarButton
              variant={variant}
              label="Underline"
              pressed={ed.isActive("underline")}
              onClick={() => ed.chain().focus().toggleUnderline().run()}
            >
              <UnderlineIcon className="h-4 w-4" strokeWidth={2} />
            </ToolbarButton>
            <ToolbarButton
              variant={variant}
              label="Strikethrough"
              pressed={ed.isActive("strike")}
              disabled={!ed.can().toggleStrike()}
              onClick={() => ed.chain().focus().toggleStrike().run()}
            >
              <Strikethrough className="h-4 w-4" strokeWidth={2} />
            </ToolbarButton>
          </ToolbarGroup>

          <ToolbarGroup label="Headings" variant={variant}>
            <ToolbarButton
              variant={variant}
              label="Heading 2"
              pressed={ed.isActive("heading", { level: 2 })}
              onClick={() =>
                ed.chain().focus().toggleHeading({ level: 2 }).run()
              }
            >
              <Heading2 className="h-4 w-4" strokeWidth={2} />
            </ToolbarButton>
            <ToolbarButton
              variant={variant}
              label="Heading 3"
              pressed={ed.isActive("heading", { level: 3 })}
              onClick={() =>
                ed.chain().focus().toggleHeading({ level: 3 }).run()
              }
            >
              <Heading3 className="h-4 w-4" strokeWidth={2} />
            </ToolbarButton>
          </ToolbarGroup>

          <ToolbarGroup label="Lists" variant={variant}>
            <ToolbarButton
              variant={variant}
              label="Bullet list"
              pressed={ed.isActive("bulletList")}
              onClick={() => ed.chain().focus().toggleBulletList().run()}
            >
              <List className="h-4 w-4" strokeWidth={2} />
            </ToolbarButton>
            <ToolbarButton
              variant={variant}
              label="Numbered list"
              pressed={ed.isActive("orderedList")}
              onClick={() => ed.chain().focus().toggleOrderedList().run()}
            >
              <ListOrdered className="h-4 w-4" strokeWidth={2} />
            </ToolbarButton>
            <ToolbarButton
              variant={variant}
              label="Quote"
              pressed={ed.isActive("blockquote")}
              onClick={() => ed.chain().focus().toggleBlockquote().run()}
            >
              <Quote className="h-4 w-4" strokeWidth={2} />
            </ToolbarButton>
            <ToolbarButton
              variant={variant}
              label="Horizontal rule"
              onClick={() => ed.chain().focus().setHorizontalRule().run()}
            >
              <Minus className="h-4 w-4" strokeWidth={2} />
            </ToolbarButton>
          </ToolbarGroup>

          <ToolbarGroup label="Links" variant={variant}>
            <ToolbarButton
              variant={variant}
              label="Add or edit link"
              pressed={ed.isActive("link")}
              onClick={openLinkDialog}
            >
              <LinkIcon className="h-4 w-4" strokeWidth={2} />
            </ToolbarButton>
            <ToolbarButton
              variant={variant}
              label="Remove link"
              onClick={() => ed.chain().focus().unsetLink().run()}
            >
              <Link2Off className="h-4 w-4" strokeWidth={2} />
            </ToolbarButton>
          </ToolbarGroup>

          <ToolbarGroup label="History" variant={variant}>
            <ToolbarButton
              variant={variant}
              label="Undo"
              disabled={!ed.can().undo()}
              onClick={() => ed.chain().focus().undo().run()}
            >
              <Undo2 className="h-4 w-4" strokeWidth={2} />
            </ToolbarButton>
            <ToolbarButton
              variant={variant}
              label="Redo"
              disabled={!ed.can().redo()}
              onClick={() => ed.chain().focus().redo().run()}
            >
              <Redo2 className="h-4 w-4" strokeWidth={2} />
            </ToolbarButton>
          </ToolbarGroup>
        </div>
      </div>

      <div className={clsx(editorAreaClass[variant], "lm-rich-editor")}>
        <EditorContent editor={ed} />
      </div>
    </div>
  );
}
