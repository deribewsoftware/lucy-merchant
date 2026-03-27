"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { type ReactNode } from "react";
import {
  HiOutlineShieldCheck,
  HiOutlineLockClosed,
  HiOutlineChatBubbleLeftRight,
} from "react-icons/hi2";
import { brandCopy } from "@/lib/brand/copy";

/* ── floating orb (pure CSS anim via globals.css) ─────────────── */
function Orb({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`absolute rounded-full opacity-30 blur-3xl ${className ?? ""}`}
    />
  );
}

const trustItems = [
  { icon: HiOutlineShieldCheck, text: "JWT-secured roles" },
  { icon: HiOutlineLockClosed, text: "Verified companies only" },
  { icon: HiOutlineChatBubbleLeftRight, text: "Order-linked chat" },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
} as const;

const childVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full flex-row bg-base-100">
      {/* ── Left brand panel ────────── */}
      <div className="relative hidden w-[45%] max-w-[560px] flex-col overflow-hidden lg:flex"
           style={{
             background: 'linear-gradient(135deg, oklch(0.22 0.08 200) 0%, oklch(0.18 0.10 240) 40%, oklch(0.15 0.12 280) 100%)'
           }}>
        {/* Gradient mesh background */}
        <div className="lm-auth-mesh-bg" aria-hidden />

        {/* Floating orbs */}
        <Orb className="lm-auth-orb-1 h-72 w-72 bg-primary/50" />
        <Orb className="lm-auth-orb-2 h-56 w-56 bg-accent/40" />
        <Orb className="lm-auth-orb-3 h-40 w-40 bg-info/35" />

        {/* Content */}
        <div className="relative z-10 flex flex-1 flex-col items-start justify-center px-12 xl:px-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link href="/" className="group mb-10 flex items-center gap-3 outline-none">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 shadow-lg backdrop-blur-sm transition-transform group-hover:scale-105">
                <span className="text-2xl font-bold text-white">L</span>
              </div>
              <span className="font-display text-2xl font-bold tracking-tight text-white">
                {brandCopy.name}
              </span>
            </Link>

            <h2 className="max-w-md font-display text-3xl font-bold leading-snug text-white xl:text-4xl">
              {brandCopy.hero.headline.split(".")[0]}.
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70 xl:text-base">
              {brandCopy.tagline}
            </p>

            {/* Trust badges */}
            <div className="mt-10 flex flex-col gap-3">
              {trustItems.map(({ icon: Icon, text }, i) => (
                <motion.div
                  key={text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center gap-3 text-white/80"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                    <Icon className="h-[18px] w-[18px]" />
                  </div>
                  <span className="text-sm font-medium">{text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom flair */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      {/* ── Right form panel ───────────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center p-4 sm:p-8 lg:p-12 overflow-y-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="mx-auto flex w-full max-w-[460px] flex-col"
        >
          {/* Mobile-only brand row */}
          <motion.div variants={childVariants} className="mb-8 flex justify-center lg:hidden">
            <Link href="/" className="group flex items-center gap-3 outline-none">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/25 transition-transform group-hover:scale-[1.03]">
                <span className="text-xl font-bold text-primary-foreground">L</span>
              </div>
              <span className="font-display text-xl font-bold tracking-tight text-foreground">
                {brandCopy.name}
              </span>
            </Link>
          </motion.div>

          {children}
        </motion.div>
      </div>
    </div>
  );
}

/* Re-export child variant for pages to stagger their own children */
export { childVariants, containerVariants };
