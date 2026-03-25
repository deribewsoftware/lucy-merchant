"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  Loader2,
  MessageCircle,
  Minimize2,
  SendHorizontal,
  Sparkles,
  User,
} from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { brandCopy } from "@/lib/brand/copy";
import { PresenceAvatar } from "@/components/presence-avatar";
import { usePresenceSelf } from "@/components/presence-provider";

type ChatMessage = { role: "user" | "assistant"; content: string };

const WELCOME =
  `Hi — I’m Lucy Assist. I can help you navigate ${brandCopy.name}: browsing suppliers, search, cart & checkout, and your portal. What would you like to do?`;

export function SupportBot() {
  const { selfIsOnline } = usePresenceSelf();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: WELCOME },
  ]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, open, pending, scrollToBottom]);

  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 320);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  async function send() {
    const text = input.trim();
    if (!text || pending) return;
    setInput("");
    setError(null);

    const nextUser: ChatMessage = { role: "user", content: text };
    const history = [...messages, nextUser];

    setMessages(history);
    setPending(true);

    try {
      const res = await fetch("/api/support-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      if (data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply! }]);
      }
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  function resetChat() {
    setMessages([{ role: "assistant", content: WELCOME }]);
    setError(null);
    setInput("");
  }

  return (
    <div className="pointer-events-none fixed bottom-0 right-0 z-[100] flex flex-col items-end gap-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pr-[max(1rem,env(safe-area-inset-right))] sm:p-6">
      <AnimatePresence mode="sync">
        {open && (
          <motion.div
            key="panel"
            id={panelId}
            role="dialog"
            aria-label="Support assistant"
            initial={{ opacity: 0, y: 24, scale: 0.94, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 16, scale: 0.96, filter: "blur(2px)" }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="pointer-events-auto mb-3 w-[min(100vw-2rem,22rem)] origin-bottom-right overflow-hidden rounded-2xl border border-base-300/60 bg-base-100/95 shadow-2xl shadow-primary/10 ring-1 ring-base-content/5 backdrop-blur-md sm:w-[min(100vw-2.5rem,24rem)]"
          >
            <div className="relative overflow-hidden border-b border-base-300/50 bg-gradient-to-br from-primary/15 via-base-200/40 to-accent/10 px-4 py-3">
              <motion.div
                className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/20 blur-2xl"
                animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.55, 0.35] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="relative flex items-start gap-3">
                <div className="relative isolate shrink-0 overflow-visible">
                  <div className="relative z-0 flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-primary text-primary-content shadow-lg shadow-primary/25">
                    <Bot className="h-6 w-6" aria-hidden />
                    <motion.span
                      className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-primary/40"
                      animate={{ opacity: [0.4, 0.9, 0.4], scale: [1, 1.08, 1] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </div>
                  <span
                    className="pointer-events-none absolute end-0 top-0 z-30 h-3 w-3 translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-base-100 bg-success shadow-sm ring-1 ring-success/30"
                    title="Assistant is always available"
                    aria-hidden
                  />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="font-display text-sm font-semibold tracking-tight text-base-content">
                    Lucy Assist
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-base-content/65">
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-medium text-success">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" aria-hidden />
                      Always on
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
                      AI helper — tips & navigation
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="btn btn-ghost btn-square btn-sm shrink-0 text-base-content/70 hover:bg-base-200/80"
                  aria-label="Minimize chat"
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div
              ref={listRef}
              className="max-h-[min(52vh,320px)] space-y-3 overflow-y-auto px-3 py-3"
            >
              {messages.map((m, i) => (
                <motion.div
                  key={`${i}-${m.role}-${m.content.slice(0, 24)}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22 }}
                  className={`flex items-end gap-2 overflow-visible ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {m.role === "assistant" && (
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-base-300/60 bg-base-200/80 text-primary shadow-sm"
                      aria-hidden
                    >
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={
                      m.role === "user"
                        ? "max-w-[92%] rounded-2xl rounded-br-md bg-primary px-3 py-2 text-sm leading-relaxed text-primary-content shadow-md shadow-primary/15"
                        : "max-w-[94%] rounded-2xl rounded-bl-md border border-base-300/50 bg-base-200/50 px-3 py-2 text-sm leading-relaxed text-base-content"
                    }
                  >
                    {m.content}
                  </div>
                  {m.role === "user" && (
                    <PresenceAvatar
                      size="sm"
                      selfOnline={selfIsOnline}
                      ringClassName="ring-2 ring-primary/25"
                      dotClassName="border-base-100"
                      className="bg-primary text-primary-content shadow-sm"
                      decorative
                    >
                      <User className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                    </PresenceAvatar>
                  )}
                </motion.div>
              ))}
              {pending && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-end justify-start gap-2"
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-base-300/60 bg-base-200/80 text-primary shadow-sm"
                    aria-hidden
                  >
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-base-300/50 bg-base-200/40 px-3 py-2 text-sm text-base-content/70">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
                    Thinking…
                  </div>
                </motion.div>
              )}
            </div>

            {error && (
              <div className="mx-3 mb-2 rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-xs text-error">
                {error}
              </div>
            )}

            <div className="border-t border-base-300/50 bg-base-100/90 p-3">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                  placeholder="Ask anything…"
                  className="input input-bordered input-sm min-h-10 flex-1 border-base-300/70 bg-base-200/30 text-sm"
                  disabled={pending}
                  autoComplete="off"
                  maxLength={2000}
                  aria-label="Message to assistant"
                />
                <button
                  type="button"
                  onClick={() => void send()}
                  disabled={pending || !input.trim()}
                  className="btn btn-primary btn-square btn-sm shrink-0 shadow-md shadow-primary/20 disabled:shadow-none"
                  aria-label="Send message"
                >
                  <SendHorizontal className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={resetChat}
                  className="btn btn-ghost btn-xs font-normal text-base-content/55 hover:text-base-content"
                >
                  New chat
                </button>
                <span className="text-[10px] text-base-content/40">Powered by OpenAI</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pointer-events-auto relative">
        {!open && (
          <motion.span
            className="absolute inset-0 rounded-full bg-primary/35"
            aria-hidden
            animate={{ scale: [1, 1.35, 1], opacity: [0.55, 0, 0.55] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <motion.button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          aria-label={open ? "Close support assistant" : "Open support assistant"}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-content shadow-xl shadow-primary/30 ring-4 ring-base-100"
        >
          <AnimatePresence mode="wait" initial={false}>
            {open ? (
              <motion.span
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Minimize2 className="h-6 w-6" />
              </motion.span>
            ) : (
              <motion.span
                key="open"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
                className="relative"
              >
                <MessageCircle className="h-7 w-7" strokeWidth={2} />
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-accent-content">
                  AI
                </span>
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );
}
