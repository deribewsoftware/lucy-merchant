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
import { useEffect, type ReactNode } from "react";

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
    "rounded-lg border border-base-300/80 bg-base-100 shadow-sm transition-[box-shadow,border-color] focus-within:border-primary/70 focus-within:ring-1 focus-within:ring-primary/25",
  supplier:
    "rounded-xl border border-base-300 bg-base-100 shadow-sm transition-[box-shadow,border-color] focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
  zinc:
    "rounded-lg border border-zinc-300 bg-white shadow-sm transition-[box-shadow,border-color] focus-within:border-zinc-400 focus-within:ring-1 focus-within:ring-zinc-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:focus-within:border-zinc-600",
};

const toolbarClass: Record<RichTextEditorVariant, string> = {
  default:
    "flex flex-wrap gap-0.5 border-b border-base-300/60 bg-base-200/35 p-1.5 sm:gap-1 sm:p-2",
  supplier:
    "flex flex-wrap gap-0.5 border-b border-base-300/70 bg-base-200/40 p-1.5 sm:gap-1 sm:p-2",
  zinc:
    "flex flex-wrap gap-0.5 border-b border-zinc-200 bg-zinc-100/80 p-1.5 dark:border-zinc-700 dark:bg-zinc-900/50 sm:gap-1 sm:p-2",
};

const editorAreaClass: Record<RichTextEditorVariant, string> = {
  default: "px-3 py-2.5 text-sm text-base-content sm:px-4",
  supplier: "px-3.5 py-2.5 text-sm text-base-content",
  zinc:
    "px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 sm:px-3.5 sm:py-2.5",
};

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
  const base =
    "inline-flex h-8 min-w-[2rem] shrink-0 items-center justify-center rounded-md text-sm transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 sm:h-8 sm:min-w-[2.25rem]";
  const theme =
    variant === "zinc"
      ? pressed
        ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-50"
        : "text-zinc-600 hover:bg-zinc-200/80 dark:text-zinc-300 dark:hover:bg-zinc-800"
      : pressed
        ? "bg-primary/15 text-primary"
        : "text-base-content/75 hover:bg-base-300/50";
  return (
    <button
      type="button"
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
            "prose prose-sm max-w-none outline-none sm:prose-base",
            editorMinHeightClass,
            "px-0 py-0",
          ),
          "aria-label": ariaLabel ?? placeholder,
          ...(id ? { id } : {}),
        },
      },
      onUpdate: ({ editor: ed }) => {
        onChange(ed.getHTML());
      },
    },
    [],
  );

  useEffect(() => {
    if (!editor) return;
    const cur = editor.getHTML();
    if (value !== cur) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  if (!editor) {
    return (
      <div
        className={clsx(
          shellClass[variant],
          "animate-pulse",
          editorMinHeightClass,
          className,
        )}
        aria-hidden
      />
    );
  }

  const ed = editor;

  function setLink() {
    const prev = ed.getAttributes("link").href as string | undefined;
    const next = window.prompt("Link URL", prev ?? "https://");
    if (next === null) return;
    const t = next.trim();
    if (t === "") {
      ed.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    ed.chain().focus().extendMarkRange("link").setLink({ href: t }).run();
  }

  return (
    <div
      className={clsx(
        shellClass[variant],
        "overflow-hidden",
        disabled && "pointer-events-none opacity-60",
        className,
      )}
    >
      <div
        role="toolbar"
        aria-label="Formatting"
        className={toolbarClass[variant]}
      >
        <ToolbarButton
          variant={variant}
          label="Bold"
          pressed={ed.isActive("bold")}
          disabled={!ed.can().toggleBold()}
          onClick={() => ed.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" strokeWidth={2.25} />
        </ToolbarButton>
        <ToolbarButton
          variant={variant}
          label="Italic"
          pressed={ed.isActive("italic")}
          disabled={!ed.can().toggleItalic()}
          onClick={() => ed.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" strokeWidth={2.25} />
        </ToolbarButton>
        <ToolbarButton
          variant={variant}
          label="Underline"
          pressed={ed.isActive("underline")}
          onClick={() => ed.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-4 w-4" strokeWidth={2.25} />
        </ToolbarButton>
        <ToolbarButton
          variant={variant}
          label="Strikethrough"
          pressed={ed.isActive("strike")}
          onClick={() => ed.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" strokeWidth={2.25} />
        </ToolbarButton>
        <span
          className={clsx(
            "mx-0.5 hidden h-6 w-px shrink-0 self-center sm:inline",
            variant === "zinc" ? "bg-zinc-300 dark:bg-zinc-600" : "bg-base-300",
          )}
          aria-hidden
        />
        <ToolbarButton
          variant={variant}
          label="Heading 2"
          pressed={ed.isActive("heading", { level: 2 })}
          onClick={() =>
            ed.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 className="h-4 w-4" strokeWidth={2.25} />
        </ToolbarButton>
        <ToolbarButton
          variant={variant}
          label="Heading 3"
          pressed={ed.isActive("heading", { level: 3 })}
          onClick={() =>
            ed.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          <Heading3 className="h-4 w-4" strokeWidth={2.25} />
        </ToolbarButton>
        <ToolbarButton
          variant={variant}
          label="Bullet list"
          pressed={ed.isActive("bulletList")}
          onClick={() => ed.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" strokeWidth={2.25} />
        </ToolbarButton>
        <ToolbarButton
          variant={variant}
          label="Numbered list"
          pressed={ed.isActive("orderedList")}
          onClick={() => ed.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" strokeWidth={2.25} />
        </ToolbarButton>
        <ToolbarButton
          variant={variant}
          label="Quote"
          pressed={ed.isActive("blockquote")}
          onClick={() => ed.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" strokeWidth={2.25} />
        </ToolbarButton>
        <ToolbarButton
          variant={variant}
          label="Horizontal rule"
          onClick={() => ed.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="h-4 w-4" strokeWidth={2.25} />
        </ToolbarButton>
        <ToolbarButton
          variant={variant}
          label="Link"
          pressed={ed.isActive("link")}
          onClick={setLink}
        >
          <LinkIcon className="h-4 w-4" strokeWidth={2.25} />
        </ToolbarButton>
        <ToolbarButton
          variant={variant}
          label="Remove link"
          onClick={() => ed.chain().focus().unsetLink().run()}
        >
          <Link2Off className="h-4 w-4" strokeWidth={2.25} />
        </ToolbarButton>
        <span
          className={clsx(
            "mx-0.5 hidden h-6 w-px shrink-0 self-center sm:inline",
            variant === "zinc" ? "bg-zinc-300 dark:bg-zinc-600" : "bg-base-300",
          )}
          aria-hidden
        />
        <ToolbarButton
          variant={variant}
          label="Undo"
          disabled={!ed.can().undo()}
          onClick={() => ed.chain().focus().undo().run()}
        >
          <Undo2 className="h-4 w-4" strokeWidth={2.25} />
        </ToolbarButton>
        <ToolbarButton
          variant={variant}
          label="Redo"
          disabled={!ed.can().redo()}
          onClick={() => ed.chain().focus().redo().run()}
        >
          <Redo2 className="h-4 w-4" strokeWidth={2.25} />
        </ToolbarButton>
      </div>
      <div className={clsx(editorAreaClass[variant], "lm-rich-editor")}>
        <EditorContent editor={ed} />
      </div>
    </div>
  );
}
