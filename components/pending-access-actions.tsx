"use client";

import { useState } from "react";
import { HiOutlineBellAlert } from "react-icons/hi2";

export function PendingAccessActions() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function send() {
    setStatus("loading");
    setMessage(null);
    const res = await fetch("/api/admin/access-request", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus("err");
      setMessage(data.error ?? "Could not send");
      return;
    }
    setStatus("ok");
    setMessage(
      "Sent. System administrators were notified in-app; email is included when SMTP is configured.",
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        className="btn btn-primary btn-wide max-w-full sm:max-w-md"
        disabled={status === "loading"}
        onClick={() => void send()}
      >
        {status === "loading" ? (
          <span className="loading loading-spinner loading-sm" />
        ) : (
          <>
            <HiOutlineBellAlert className="h-5 w-5" />
            Notify system administrators again
          </>
        )}
      </button>
      {message ? (
        <p
          className={
            status === "err" ? "text-sm text-error" : "text-sm text-success"
          }
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
