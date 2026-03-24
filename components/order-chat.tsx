"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HiPaperAirplane } from "react-icons/hi2";
import type { ChatMessage } from "@/lib/domain/types";

type Props = {
  orderId: string;
  viewerId: string;
  closed: boolean;
};

export function OrderChat({ orderId, viewerId, closed }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [proposalOpen, setProposalOpen] = useState(false);
  const [proposalPrice, setProposalPrice] = useState("");
  const [proposalNote, setProposalNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/orders/${orderId}/messages`);
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data.messages ?? []);
  }, [orderId]);

  useEffect(() => {
    load();
    const tick = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      load();
    };
    const t = setInterval(tick, 2000);
    function onVis() {
      if (document.visibilityState === "visible") load();
    }
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (closed || !text.trim()) return;
    setSending(true);
    setError(null);
    const res = await fetch(`/api/orders/${orderId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text, kind: "text" }),
    });
    const data = await res.json().catch(() => ({}));
    setSending(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to send");
      return;
    }
    setText("");
    await load();
  }

  async function sendProposal(e: React.FormEvent) {
    e.preventDefault();
    if (closed) return;
    const n = parseFloat(proposalPrice.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) {
      setError("Enter a valid unit price");
      return;
    }
    setSending(true);
    setError(null);
    const res = await fetch(`/api/orders/${orderId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "price_proposal",
        proposedUnitPrice: n,
        content: proposalNote.trim(),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSending(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to send proposal");
      return;
    }
    setProposalPrice("");
    setProposalNote("");
    setProposalOpen(false);
    await load();
  }

  return (
    <div className="card border border-base-300 bg-base-100 shadow-md">
      <div className="border-b border-base-300 px-4 py-3">
        <h3 className="font-semibold">
          Order chat
          {closed && (
            <span className="ml-2 text-xs font-normal text-base-content/60">
              (read-only)
            </span>
          )}
        </h3>
        <p className="mt-0.5 text-xs text-base-content/55">
          Negotiate with text or a structured unit-price proposal.
        </p>
      </div>
      <div className="max-h-80 space-y-2 overflow-y-auto px-3 py-4 sm:px-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-base-content/50">
            No messages yet.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.senderId === viewerId;
          return (
            <div
              key={m.id}
              className={`chat ${mine ? "chat-end" : "chat-start"}`}
            >
              <div className="chat-header text-xs opacity-70">
                {m.senderName}{" "}
                <time className="text-xs" dateTime={m.createdAt}>
                  {new Date(m.createdAt).toLocaleString()}
                </time>
              </div>
              <div
                className={`chat-bubble text-sm ${
                  mine ? "chat-bubble-primary" : "chat-bubble-secondary"
                } ${m.kind === "price_proposal" ? "ring-2 ring-amber-400/50" : ""}`}
              >
                {m.kind === "price_proposal" && m.proposedUnitPrice != null && (
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide opacity-90">
                    Price proposal · {m.proposedUnitPrice.toLocaleString()} ETB /
                    unit
                  </p>
                )}
                {m.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      {!closed && (
        <div className="border-t border-base-300">
          <div className="flex flex-wrap gap-2 p-3 pb-0 sm:px-4">
            <button
              type="button"
              onClick={() => setProposalOpen((o) => !o)}
              className="btn btn-ghost btn-xs sm:btn-sm"
            >
              {proposalOpen ? "Hide price proposal" : "Propose unit price"}
            </button>
          </div>
          {proposalOpen && (
            <form
              onSubmit={sendProposal}
              className="space-y-2 border-b border-base-200 p-3 sm:px-4"
            >
              <div className="flex flex-wrap gap-2">
                <label className="flex flex-1 flex-col gap-1 text-xs">
                  <span className="text-base-content/60">ETB per unit</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={proposalPrice}
                    onChange={(e) => setProposalPrice(e.target.value)}
                    placeholder="e.g. 395"
                    className="input input-bordered input-sm w-full min-w-[8rem]"
                  />
                </label>
                <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-xs">
                  <span className="text-base-content/60">Note (optional)</span>
                  <input
                    value={proposalNote}
                    onChange={(e) => setProposalNote(e.target.value)}
                    placeholder="Volume, terms…"
                    className="input input-bordered input-sm w-full"
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={sending}
                className="btn btn-secondary btn-sm"
              >
                Send proposal
              </button>
            </form>
          )}
          <form
            onSubmit={send}
            className="join w-full p-3 sm:p-4"
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message…"
              className="input input-bordered join-item min-w-0 flex-1"
            />
            <button
              type="submit"
              disabled={sending}
              className="btn btn-primary join-item shrink-0 gap-1 px-4"
            >
              {sending ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <HiPaperAirplane className="h-5 w-5" />
              )}
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      )}
      {error && (
        <div role="alert" className="alert alert-error rounded-none text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
