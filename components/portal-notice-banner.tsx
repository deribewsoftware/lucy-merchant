"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { HiOutlineInformationCircle, HiOutlineXMark } from "react-icons/hi2";
import { useCallback, useMemo, useState } from "react";

const MESSAGES: Record<string, { title: string; body: string }> = {
  wrong_portal: {
    title: "Wrong workspace for your account",
    body: "That link belongs to a different portal. You were brought to your own dashboard — use the sidebar to move around your area.",
  },
  staff_only: {
    title: "Staff-only area",
    body: "That page is for admin staff. You were returned to the workspace that matches your account.",
  },
};

export function PortalNoticeBanner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const notice = searchParams.get("notice");
  const [dismissed, setDismissed] = useState(false);

  const payload = useMemo(() => {
    if (!notice || dismissed) return null;
    return MESSAGES[notice] ?? null;
  }, [notice, dismissed]);

  const clearQuery = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("notice");
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  if (!payload) return null;

  return (
    <div className="border-b border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground sm:px-6">
      <div className="mx-auto flex max-w-7xl items-start gap-3">
        <HiOutlineInformationCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">{payload.title}</p>
          <p className="mt-1 text-muted-foreground">{payload.body}</p>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-xs btn-square shrink-0"
          aria-label="Dismiss"
          onClick={() => {
            setDismissed(true);
            clearQuery();
          }}
        >
          <HiOutlineXMark className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
