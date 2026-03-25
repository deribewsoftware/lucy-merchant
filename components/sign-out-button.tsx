"use client";

import { useRouter } from "next/navigation";
import { MdLogout } from "react-icons/md";
import clsx from "clsx";
import { LM_LOGOUT_EVENT } from "@/components/presence-provider";

type Props = {
  className?: string;
};

export function SignOutButton({ className }: Props) {
  const router = useRouter();
  return (
    <button
      type="button"
      className={clsx(
        "btn btn-ghost btn-sm gap-2 normal-case",
        className,
      )}
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.dispatchEvent(new CustomEvent(LM_LOGOUT_EVENT));
        router.push("/");
        router.refresh();
      }}
    >
      <MdLogout className="h-4 w-4" />
      Sign out
    </button>
  );
}
