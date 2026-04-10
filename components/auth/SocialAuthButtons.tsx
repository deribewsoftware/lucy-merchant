"use client";

import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import type { IconType } from "react-icons";

interface Provider {
  id: string;
  label: string;
  icon: IconType;
  iconClassName?: string;
  className: string;
}

/** Google is wired; add more entries when additional OAuth routes exist. */
const providers: Provider[] = [
  {
    id: "google",
    label: "Google",
    icon: FcGoogle,
    className:
      "border-base-300/70 bg-base-100 text-foreground hover:bg-base-200/80 hover:border-base-300",
  },
];

interface SocialAuthButtonsProps {
  mode?: "login" | "register";
  /** When mode is register, passed to Google OAuth so new accounts get the selected role. */
  oauthRole?: "merchant" | "supplier";
  /**
   * Must match server env (same as GET /api/auth/oauth/status `google`).
   * Passed from a Server Component so SSR and hydration render the same tree.
   */
  googleOAuthConfigured: boolean;
}

function oauthHref(
  providerId: string,
  mode: "login" | "register",
  nextParam: string | null,
  oauthRole: "merchant" | "supplier" | undefined,
): string {
  const q = new URLSearchParams();
  q.set("intent", mode === "register" ? "register" : "login");
  if (mode === "register") {
    q.set("role", oauthRole ?? "merchant");
  }
  if (mode === "login" && nextParam && nextParam.startsWith("/")) {
    q.set("next", nextParam);
  }
  const qs = q.toString();
  return `/api/auth/oauth/${providerId}${qs ? `?${qs}` : ""}`;
}

function SocialAuthButtonsCore({
  mode,
  oauthRole,
  googleOAuthConfigured,
  nextParam,
}: SocialAuthButtonsProps & { nextParam: string | null }) {
  const resolvedMode: "login" | "register" = mode ?? "login";
  const verb = resolvedMode === "login" ? "Sign in" : "Sign up";
  const gridCols =
    providers.length >= 3 ? "grid-cols-3" : providers.length === 2 ? "grid-cols-2" : "grid-cols-1";

  if (!googleOAuthConfigured) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className={`grid gap-3 ${gridCols}`}>
        {providers.map(({ id, label, icon: Icon, iconClassName, className }, i) => (
          <motion.a
            key={id}
            href={oauthHref(id, resolvedMode, nextParam, oauthRole)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={`group flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-all duration-200 active:scale-[0.97] ${className}`}
            title={`${verb} with ${label}`}
          >
            <Icon className={`h-5 w-5 transition-transform group-hover:scale-110 ${iconClassName ?? ""}`} />
            <span className="hidden sm:inline">{label}</span>
          </motion.a>
        ))}
      </div>

      {/* Divider */}
      <div className="relative flex items-center gap-4 py-1">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/60 to-transparent" />
        <span className="shrink-0 text-xs font-medium uppercase tracking-widest text-muted-foreground/70">
          or continue with email
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/60 to-transparent" />
      </div>
    </div>
  );
}

/** Uses `useSearchParams` for `next`; keep register on `SocialAuthButtonsCore` only to avoid Suspense SSR/client HTML mismatch. */
function SocialAuthButtonsLogin(props: SocialAuthButtonsProps) {
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  return <SocialAuthButtonsCore {...props} nextParam={nextParam} />;
}

export default function SocialAuthButtons(props: SocialAuthButtonsProps) {
  const mode = props.mode ?? "login";
  if (!props.googleOAuthConfigured) {
    return null;
  }
  if (mode === "register") {
    return <SocialAuthButtonsCore {...props} mode="register" nextParam={null} />;
  }
  return <SocialAuthButtonsLogin {...props} mode="login" />;
}
