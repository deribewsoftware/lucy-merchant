"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MdLogout } from "react-icons/md";
import clsx from "clsx";
import { LM_LOGOUT_EVENT } from "@/components/presence-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Props = {
  className?: string;
};

export function SignOutButton({ className }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function performSignOut() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.dispatchEvent(new CustomEvent(LM_LOGOUT_EVENT));
      setOpen(false);
      router.push("/");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={clsx(
          "btn btn-ghost btn-sm gap-2 normal-case",
          className,
        )}
        onClick={() => setOpen(true)}
      >
        <MdLogout className="h-4 w-4" />
        Sign out
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Sign out?"
        description="You will need to sign in again to access your account and orders."
        variant="neutral"
        confirmLabel="Sign out"
        cancelLabel="Stay signed in"
        loading={busy}
        onConfirm={performSignOut}
      />
    </>
  );
}
