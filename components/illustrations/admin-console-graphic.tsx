"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Decorative SVG for admin dashboard — abstract console / analytics motif.
 */
export function AdminConsoleGraphic({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      aria-hidden
    >
      <svg
        viewBox="0 0 440 320"
        className="h-auto w-full max-w-md drop-shadow-sm"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="admBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect
          x="24"
          y="32"
          width="392"
          height="256"
          rx="28"
          className="stroke-base-300"
          strokeWidth="1.5"
          fill="oklch(var(--b1) / 0.9)"
        />

        <g className="text-primary">
          <rect
            x="48"
            y="56"
            width="120"
            height="10"
            rx="5"
            fill="currentColor"
            fillOpacity="0.35"
          />
        </g>
        <rect
          x="48"
          y="78"
          width="80"
          height="8"
          rx="4"
          className="fill-base-content/15"
        />

        <g filter="url(#admBlur)">
          <rect
            x="48"
            y="108"
            width="344"
            height="140"
            rx="16"
            className="stroke-base-300/80"
            strokeWidth="1"
            fill="oklch(var(--b2) / 0.45)"
          />
          <g className="text-primary">
            <rect
              x="72"
              y="196"
              width="28"
              height="36"
              rx="6"
              fill="currentColor"
              fillOpacity="0.65"
            />
          </g>
          <g className="text-secondary">
            <rect
              x="112"
              y="172"
              width="28"
              height="60"
              rx="6"
              fill="currentColor"
              fillOpacity="0.7"
            />
          </g>
          <g className="text-accent">
            <rect
              x="152"
              y="184"
              width="28"
              height="48"
              rx="6"
              fill="currentColor"
              fillOpacity="0.65"
            />
          </g>
          <g className="text-success">
            <rect
              x="192"
              y="156"
              width="28"
              height="76"
              rx="6"
              fill="currentColor"
              fillOpacity="0.55"
            />
          </g>
          <g className="text-primary">
            <rect
              x="232"
              y="188"
              width="28"
              height="44"
              rx="6"
              fill="currentColor"
              fillOpacity="0.4"
            />
          </g>
          <motion.path
            d="M 300 200 Q 330 150 360 165"
            className="stroke-secondary"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            initial={false}
            animate={
              reduce
                ? {}
                : {
                    strokeOpacity: [0.5, 1, 0.5],
                  }
            }
            transition={
              reduce
                ? {}
                : { duration: 3.5, repeat: Infinity, ease: "easeInOut" }
            }
          />
        </g>

        <g className="text-primary">
          <circle cx="368" cy="72" r="36" fill="currentColor" fillOpacity="0.1" />
          <path
            d="M352 72h32M368 56v32"
            stroke="currentColor"
            strokeOpacity="0.45"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>
        <rect
          x="48"
          y="262"
          width="160"
          height="14"
          rx="7"
          className="fill-base-content/10"
        />
        <g className="text-success">
          <rect
            x="220"
            y="262"
            width="100"
            height="14"
            rx="7"
            fill="currentColor"
            fillOpacity="0.22"
          />
        </g>
      </svg>
    </motion.div>
  );
}
