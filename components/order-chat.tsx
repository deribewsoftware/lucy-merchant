"use client";

import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineBuildingStorefront,
  HiOutlinePaperAirplane,
  HiOutlinePhoto,
  HiOutlineShieldCheck,
  HiOutlineShoppingBag,
  HiOutlineXMark,
} from "react-icons/hi2";
import { PresenceAvatar } from "@/components/presence-avatar";
import { isStaffAdminRole } from "@/lib/admin-staff";
import type { ChatMessage, UserRole } from "@/lib/domain/types";

type MessageWithRole = ChatMessage & { senderRole: UserRole };

type Props = {
  orderId: string;
  viewerId: string;
  viewerRole: UserRole;
  closed: boolean;
  paymentGate?: boolean;
};

function initialsFromSenderName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** DaisyUI chat-bubble color by participant role */
function daisyChatBubbleClass(role: UserRole): string {
  switch (role) {
    case "merchant":
      return "chat-bubble-success";
    case "supplier":
      return "chat-bubble-warning";
    case "admin":
    case "system_admin":
      return "chat-bubble-secondary";
    default:
      return "chat-bubble-neutral";
  }
}

function rolePresentation(role: UserRole) {
  switch (role) {
    case "merchant":
      return {
        label: "Buyer",
        short: "Buyer",
        Icon: HiOutlineShoppingBag,
        avatar:
          "bg-gradient-to-br from-emerald-500 to-teal-600 text-white",
      };
    case "supplier":
      return {
        label: "Supplier",
        short: "Supplier",
        Icon: HiOutlineBuildingStorefront,
        avatar:
          "bg-gradient-to-br from-amber-500 to-orange-600 text-white",
      };
    case "admin":
    case "system_admin":
      return {
        label: "Platform",
        short: "Platform",
        Icon: HiOutlineShieldCheck,
        avatar:
          "bg-gradient-to-br from-violet-600 to-indigo-700 text-white",
      };
    default:
      return rolePresentation("merchant");
  }
}

export function OrderChat({
  orderId,
  viewerId,
  viewerRole,
  closed,
  paymentGate = false,
}: Props) {
  const [messages, setMessages] = useState<MessageWithRole[]>([]);
  const [text, setText] = useState("");
  const [proposalOpen, setProposalOpen] = useState(false);
  const [proposalPrice, setProposalPrice] = useState("");
  const [proposalNote, setProposalNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [presence, setPresence] = useState<Record<string, string>>({});
  const listRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (paymentGate) return;
    const res = await fetch(`/api/orders/${orderId}/messages`);
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data.messages ?? []);
    if (data.presence && typeof data.presence === "object") {
      setPresence(data.presence as Record<string, string>);
    }
  }, [orderId, paymentGate]);

  useEffect(() => {
    if (paymentGate) return;
    const rafId = requestAnimationFrame(() => {
      void load();
    });
    const tick = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      load();
    };
    const intervalId = setInterval(tick, 2000);
    function onVis() {
      if (document.visibilityState === "visible") load();
    }
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(rafId);
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [load, paymentGate]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [messages]);

  function clearPendingImage() {
    setPendingPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPendingFile(null);
  }

  function onPickFile(f: File | null) {
    if (!f || !f.type.startsWith("image/")) {
      setError("Choose an image file");
      return;
    }
    if (f.size > 4 * 1024 * 1024) {
      setError("Image must be 4MB or smaller");
      return;
    }
    setError(null);
    setPendingPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
    setPendingFile(f);
  }

  if (paymentGate) {
    return (
      <div className="overflow-hidden rounded-2xl border border-base-300 bg-base-200/30 shadow-lg">
        <div className="border-b border-base-300 bg-base-200/40 px-5 py-4">
          <h3 className="font-display font-semibold text-base-content">
            Order chat
          </h3>
        </div>
        <div className="p-6 text-center">
          <p className="text-sm text-base-content/65">
            Messaging opens after your payment is confirmed and the order is sent
            to suppliers.
          </p>
        </div>
      </div>
    );
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (closed) return;
    if (!text.trim() && !pendingFile) return;
    setSending(true);
    setError(null);
    let imageUrl: string | undefined;
    if (pendingFile) {
      const fd = new FormData();
      fd.append("file", pendingFile);
      const up = await fetch(`/api/orders/${orderId}/chat-image`, {
        method: "POST",
        body: fd,
      });
      const data = await up.json().catch(() => ({}));
      if (!up.ok) {
        setSending(false);
        setError(data.error ?? "Could not upload image");
        return;
      }
      imageUrl = data.url as string | undefined;
      if (!imageUrl) {
        setSending(false);
        setError("Upload failed");
        return;
      }
    }
    const res = await fetch(`/api/orders/${orderId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: text,
        ...(imageUrl ? { imageUrl } : {}),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSending(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to send");
      return;
    }
    setText("");
    clearPendingImage();
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

  const sendButtonClass =
    viewerRole === "merchant"
      ? "btn-primary"
      : viewerRole === "supplier"
        ? "btn-warning text-warning-content"
        : "btn-secondary";

  return (
    <div className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm ring-1 ring-base-300/25">
      <div className="relative border-b border-base-300 bg-base-100 px-4 py-4 sm:px-5">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner ring-1 ring-primary/15">
            <HiOutlineChatBubbleLeftRight className="h-6 w-6" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <h3 className="font-display text-lg font-semibold tracking-tight text-base-content">
                Order chat
              </h3>
              {closed ? (
                <span className="badge badge-ghost badge-sm border-base-300 font-normal text-base-content/60">
                  Read-only
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-xs text-base-content/50">
              Coordinate delivery, pricing, and photos in one thread.
            </p>
            <p className="mt-1.5 text-[10px] leading-snug text-base-content/45 sm:text-[11px]">
              <span className="flex flex-col gap-1.5 sm:inline sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-1 sm:gap-y-0">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" aria-hidden />
                  <span className="min-w-0">Active in the last 2 minutes</span>
                </span>
                <span className="hidden sm:inline" aria-hidden>
                  ·
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-base-content/35"
                    aria-hidden
                  />
                  <span className="min-w-0">Not recently active</span>
                </span>
              </span>
              <span className="mt-1 block text-[10px] text-base-content/40 sm:mt-0 sm:inline">
                <span className="hidden sm:inline" aria-hidden>
                  {" — "}
                </span>
                Hover an avatar for last seen.
              </span>
            </p>
          </div>
        </div>
      </div>

      <div
        ref={listRef}
        className="max-h-[22rem] space-y-3 overflow-y-auto overscroll-contain bg-base-200/15 px-3 py-4 sm:px-4"
      >
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-base-content/50">
            No messages yet — start the conversation.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.senderId === viewerId;
          const role = m.senderRole;
          const pres = rolePresentation(role);
          const initials = initialsFromSenderName(m.senderName);
          const RoleIcon = pres.Icon;
          const bubbleMod = daisyChatBubbleClass(role);

          return (
            <div
              key={m.id}
              className={clsx("chat", mine ? "chat-end" : "chat-start")}
            >
              <div className="chat-image avatar !overflow-visible">
                <div className="w-10 shrink-0 overflow-visible">
                  <PresenceAvatar
                    size="md"
                    lastSeenAt={presence[m.senderId]}
                    ringClassName="ring-2 ring-base-100"
                    dotClassName="border-base-100"
                    className={clsx(
                      "text-[10px] font-bold text-white",
                      pres.avatar,
                    )}
                    decorative
                  >
                    {initials}
                  </PresenceAvatar>
                </div>
              </div>
              <div className="chat-header flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-base-300/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-base-content/80">
                  <RoleIcon className="h-3 w-3 opacity-90" />
                  {pres.short}
                </span>
                {mine ? (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                    You
                  </span>
                ) : null}
                <span className="text-xs opacity-70">{m.senderName}</span>
                <time
                  className="text-[10px] opacity-50"
                  dateTime={m.createdAt}
                >
                  {new Date(m.createdAt).toLocaleString()}
                </time>
              </div>
              <div
                className={clsx(
                  "chat-bubble text-sm leading-relaxed",
                  bubbleMod,
                  m.kind === "price_proposal" &&
                    "ring-2 ring-amber-400/50 ring-offset-2 ring-offset-base-200",
                )}
              >
                {m.kind === "price_proposal" && m.proposedUnitPrice != null && (
                  <p className="mb-2 flex flex-wrap items-center gap-2 border-b border-base-content/10 pb-2 text-xs font-bold uppercase tracking-wide opacity-90">
                    <span className="rounded-md bg-base-content/10 px-2 py-0.5">
                      Price proposal
                    </span>
                    <span className="tabular-nums">
                      {m.proposedUnitPrice.toLocaleString()} ETB / unit
                    </span>
                  </p>
                )}
                {m.kind === "image" && m.imageUrl ? (
                  <figure className="mb-2 overflow-hidden rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.imageUrl}
                      alt=""
                      className="max-h-64 w-full max-w-xs object-contain sm:max-w-sm"
                    />
                  </figure>
                ) : null}
                {m.content ? (
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {!closed && (
        <div className="border-t border-base-300 bg-base-100/90">
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

          {pendingPreview ? (
            <div className="relative mx-3 mt-2 overflow-hidden rounded-xl border border-base-300 bg-base-200/40 sm:mx-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pendingPreview}
                alt=""
                className="max-h-40 w-full object-contain"
              />
              <button
                type="button"
                onClick={clearPendingImage}
                className="btn btn-circle btn-ghost btn-sm absolute end-2 top-2 bg-base-100/90"
                aria-label="Remove image"
              >
                <HiOutlineXMark className="h-5 w-5" />
              </button>
            </div>
          ) : null}

          <form onSubmit={send} className="flex flex-col gap-2 p-3 sm:p-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                e.target.value = "";
                onPickFile(f);
              }}
            />
            <div className="flex w-full items-stretch gap-2">
              <button
                type="button"
                className="btn btn-square btn-outline shrink-0 border-base-300"
                title="Attach image"
                aria-label="Attach image"
                onClick={() => fileInputRef.current?.click()}
              >
                <HiOutlinePhoto className="h-6 w-6" />
              </button>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  pendingFile
                    ? "Add a caption (optional)…"
                    : viewerRole === "merchant"
                      ? "Message suppliers and platform…"
                      : isStaffAdminRole(viewerRole)
                        ? "Moderation note to thread…"
                        : "Message the buyer…"
                }
                className="input input-bordered min-h-12 min-w-0 flex-1 border-base-300"
              />
              <button
                type="submit"
                disabled={sending || (!text.trim() && !pendingFile)}
                className={clsx("btn shrink-0 gap-1.5 px-4", sendButtonClass)}
              >
                {sending ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <HiOutlinePaperAirplane className="h-5 w-5" />
                )}
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
            <p className="text-[10px] text-base-content/45">
              Sending as{" "}
              <span className="font-medium text-base-content/70">
                {rolePresentation(viewerRole).label}
              </span>
            </p>
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
