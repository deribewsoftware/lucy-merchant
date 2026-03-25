"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Building2, Check, ChevronDown, Copy, Search } from "lucide-react";
import type { PlatformBankAccount } from "@/lib/data/ethiopian-banks";
import { PLATFORM_BANK_ACCOUNTS } from "@/lib/data/ethiopian-banks";
import {
  platformBankMonogramGradient,
  platformBankMonogramShort,
} from "@/lib/data/bank-branding";

function buildPaymentDetailsText(
  bank: PlatformBankAccount,
  memo?: string,
): string {
  const lines = [
    `Bank: ${bank.bankName}`,
    bank.branch ? `Branch: ${bank.branch}` : null,
    `Account name: ${bank.accountName}`,
    `Account number: ${bank.accountNumber}`,
    memo ? `Reference / memo: ${memo}` : null,
  ].filter(Boolean);
  return lines.join("\n");
}

/** Semantic tokens — primary / accent match Lucy brand theme */
const TONE_STYLES = {
  default: {
    subtitle: "text-muted-foreground",
    memo: "border-dashed border-primary/25 bg-primary/5",
    trigger:
      "border-base-300 bg-base-100 hover:border-primary/35 focus-visible:ring-primary/30",
    dropdown: "border-base-300 bg-base-100 shadow-xl ring-1 ring-base-300/50",
    search: "border-base-300 bg-base-200/50 focus-visible:ring-primary/25",
    listBtn: "hover:bg-primary/10 data-[active=true]:bg-primary/15",
    detail: "border-base-300/90 bg-base-200/30",
    copySecondary:
      "border-base-300 bg-base-100 hover:bg-base-200 text-base-content",
    copyPrimary: "border-primary/30 bg-primary/10 hover:bg-primary/15",
  },
  primary: {
    subtitle: "text-muted-foreground",
    memo: "border-dashed border-primary/30 bg-primary/[0.07]",
    trigger:
      "border-primary/25 bg-background/90 hover:border-primary/40 focus-visible:ring-primary/35 dark:bg-background/40",
    dropdown:
      "border-primary/20 bg-base-100 shadow-xl ring-1 ring-primary/15 dark:bg-base-200/90",
    search: "border-primary/20 bg-base-100 focus-visible:ring-primary/30",
    listBtn: "hover:bg-primary/10 data-[active=true]:bg-primary/18",
    detail: "border-primary/20 bg-primary/[0.04]",
    copySecondary:
      "border-primary/25 bg-background/80 hover:bg-primary/10 text-foreground",
    copyPrimary: "border-primary/35 bg-primary/10 hover:bg-primary/18",
  },
  accent: {
    subtitle: "text-base-content/70",
    memo: "border-dashed border-accent/35 bg-accent/10",
    trigger:
      "border-accent/30 bg-base-100 hover:border-accent/45 focus-visible:ring-accent/35",
    dropdown:
      "border-base-300 bg-base-100 shadow-xl ring-1 ring-accent/20",
    search: "border-base-300 bg-base-200/50 focus-visible:ring-accent/30",
    listBtn: "hover:bg-accent/12 data-[active=true]:bg-accent/18",
    detail: "border-accent/25 bg-accent/5",
    copySecondary:
      "border-base-300 bg-base-100 hover:bg-base-200 text-base-content",
    copyPrimary: "border-accent/35 bg-accent/15 hover:bg-accent/25",
  },
} as const;

type Tone = keyof typeof TONE_STYLES;

type Props = {
  transferMemoHint?: string;
  subtitle?: string;
  accountsHeading?: string;
  className?: string;
  tone?: Tone;
  /** Smaller type + tighter dropdown (commission cards) */
  compact?: boolean;
};

export function PlatformBankAccountsPanel({
  transferMemoHint,
  subtitle = "Choose a platform account. Copy details into your banking app.",
  accountsHeading = "Receiving account",
  className = "",
  tone = "default",
  compact = false,
}: Props) {
  const tc = TONE_STYLES[tone];
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    PLATFORM_BANK_ACCOUNTS[0]?.id ?? null,
  );
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return PLATFORM_BANK_ACCOUNTS;
    return PLATFORM_BANK_ACCOUNTS.filter(
      (b) =>
        b.bankName.toLowerCase().includes(s) ||
        b.accountNumber.toLowerCase().includes(s) ||
        b.accountName.toLowerCase().includes(s),
    );
  }, [q]);

  const selected =
    filtered.find((b) => b.id === selectedId) ?? filtered[0] ?? null;

  useEffect(() => {
    if (
      selectedId &&
      !filtered.some((b) => b.id === selectedId)
    ) {
      setSelectedId(filtered[0]?.id ?? null);
    }
  }, [filtered, selectedId]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", onDoc);
      document.addEventListener("keydown", onKey);
      return () => {
        document.removeEventListener("mousedown", onDoc);
        document.removeEventListener("keydown", onKey);
      };
    }
  }, [open]);

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }

  const labelMuted =
    tone === "accent" ? "text-base-content/60" : "text-muted-foreground";
  const bodyText = tone === "accent" ? "text-base-content" : "text-foreground";
  const textXs = compact ? "text-[11px]" : "text-xs";
  const textList = compact ? "text-[11px] leading-snug" : "text-sm";

  return (
    <div className={`space-y-2 ${className}`}>
      {subtitle ? (
        <p className={`${textXs} ${tc.subtitle}`}>{subtitle}</p>
      ) : null}

      {transferMemoHint ? (
        <div className={`rounded-lg px-2 py-1.5 ${textXs} ${tc.memo}`}>
          <p className={`font-semibold uppercase tracking-wide ${labelMuted}`}>
            Memo
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className={`font-mono font-semibold tabular-nums ${bodyText}`}>
              {transferMemoHint}
            </span>
            <button
              type="button"
              onClick={() => copy(transferMemoHint, "memo")}
              className={`inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[10px] font-medium ${tc.copySecondary}`}
            >
              {copied === "memo" ? (
                <Check className="h-3 w-3 text-success" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              Copy
            </button>
          </div>
        </div>
      ) : null}

      <div>
        <p className={`mb-1 text-[10px] font-semibold uppercase tracking-wider ${labelMuted}`}>
          {accountsHeading}
        </p>
        <div className="relative" ref={rootRef}>
          <button
            type="button"
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-controls={listId}
            onClick={() => setOpen((o) => !o)}
            className={`flex w-full items-center gap-2 rounded-lg border text-left transition focus-visible:outline-none focus-visible:ring-2 ${compact ? "px-2 py-1.5" : "px-2.5 py-2"} ${textList} ${tc.trigger}`}
          >
            {selected ? (
              <>
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white ${platformBankMonogramGradient(selected.id)}`}
                >
                  {platformBankMonogramShort(selected.id, selected.bankName)}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                  {selected.bankName}
                </span>
                <span className="max-w-[40%] shrink-0 truncate font-mono text-[10px] text-muted-foreground tabular-nums">
                  {selected.accountNumber}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">No bank</span>
            )}
            <ChevronDown
              className={`h-4 w-4 shrink-0 opacity-60 transition ${open ? "rotate-180" : ""}`}
            />
          </button>

          {open && (
            <div
              id={listId}
              role="listbox"
              className={`absolute left-0 right-0 z-[60] mt-1 flex max-h-[min(55vh,20rem)] flex-col overflow-hidden rounded-lg border ${tc.dropdown}`}
            >
              <div className="shrink-0 border-b border-base-300/60 p-1.5">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-45" />
                  <input
                    type="search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search bank or account…"
                    className={`w-full rounded-md border py-1.5 pl-8 pr-2 text-xs outline-none focus-visible:ring-2 ${tc.search}`}
                    autoComplete="off"
                    autoFocus
                  />
                </div>
              </div>
              <ul className="min-h-0 flex-1 overflow-y-auto p-1">
                {filtered.length === 0 ? (
                  <li className="px-2 py-3 text-center text-xs text-muted-foreground">
                    No matches
                  </li>
                ) : (
                  filtered.map((b) => {
                    const active = b.id === selected?.id;
                    return (
                      <li key={b.id} role="option" aria-selected={active}>
                        <button
                          type="button"
                          data-active={active}
                          className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition ${textList} ${tc.listBtn}`}
                          onClick={() => {
                            setSelectedId(b.id);
                            setOpen(false);
                            setQ("");
                          }}
                        >
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded text-[9px] font-bold text-white ${platformBankMonogramGradient(b.id)}`}
                          >
                            {platformBankMonogramShort(b.id, b.bankName)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="line-clamp-1 font-medium text-foreground">
                              {b.bankName}
                            </span>
                            <span className="block font-mono text-[10px] text-muted-foreground tabular-nums">
                              {b.accountNumber}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      {selected ? (
        <div className={`rounded-lg border p-2 ${textXs} ${tc.detail}`}>
          <div className="flex items-start gap-2">
            <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-primary opacity-80" />
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className={`font-medium ${bodyText}`}>{selected.bankName}</p>
              {selected.branch ? (
                <p className={labelMuted}>{selected.branch}</p>
              ) : null}
              <p className={labelMuted}>{selected.accountName}</p>
              <p className={`font-mono tabular-nums ${bodyText}`}>
                {selected.accountNumber}
              </p>
              {selected.qrReceiptUrl ? (
                <a
                  href={selected.qrReceiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline-offset-2 hover:underline"
                >
                  QR / receipt link
                </a>
              ) : null}
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => copy(selected.accountNumber, `${selected.id}-n`)}
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-medium ${tc.copySecondary}`}
            >
              {copied === `${selected.id}-n` ? (
                <Check className="h-3 w-3 text-success" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              Account #
            </button>
            <button
              type="button"
              onClick={() =>
                copy(
                  buildPaymentDetailsText(selected, transferMemoHint),
                  `${selected.id}-all`,
                )
              }
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-medium ${tc.copyPrimary}`}
            >
              {copied === `${selected.id}-all` ? (
                <Check className="h-3 w-3 text-success" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              Copy all
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
