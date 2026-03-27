"use client";

import { motion } from "framer-motion";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook, FaGithub } from "react-icons/fa6";
import type { IconType } from "react-icons";

interface Provider {
  id: string;
  label: string;
  icon: IconType;
  iconClassName?: string;
  className: string;
}

const providers: Provider[] = [
  {
    id: "google",
    label: "Google",
    icon: FcGoogle,
    className:
      "border-base-300/70 bg-base-100 text-foreground hover:bg-base-200/80 hover:border-base-300",
  },
  {
    id: "facebook",
    label: "Facebook",
    icon: FaFacebook,
    iconClassName: "text-[#1877F2]",
    className:
      "border-base-300/70 bg-base-100 text-foreground hover:bg-base-200/80 hover:border-base-300",
  }
];

interface SocialAuthButtonsProps {
  mode?: "login" | "register";
}

export default function SocialAuthButtons({ mode = "login" }: SocialAuthButtonsProps) {
  const verb = mode === "login" ? "Sign in" : "Sign up";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {providers.map(({ id, label, icon: Icon, iconClassName, className }, i) => (
          <motion.a
            key={id}
            href={`/api/auth/oauth/${id}`}
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
