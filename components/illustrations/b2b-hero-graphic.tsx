"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Theme-aware SVG: strokes/fills use currentColor + Daisy base tokens.
 */
export function B2BHeroGraphic() {
  const reduce = useReducedMotion();

  const float = reduce
    ? { duration: 0 }
    : { duration: 5, repeat: Infinity, ease: "easeInOut" as const };

  const pulse = reduce
    ? { duration: 0 }
    : { duration: 3.5, repeat: Infinity, ease: "easeInOut" as const };

  return (
    <div className="relative aspect-[5/4] w-full max-w-lg lg:max-w-none">
      <svg
        viewBox="0 0 480 400"
        className="h-full w-full overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <filter id="lm-soft" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g className="text-primary">
          <motion.circle
            cx="90"
            cy="320"
            r="72"
            fill="currentColor"
            fillOpacity="0.12"
            initial={false}
            animate={reduce ? {} : { scale: [1, 1.06, 1], fillOpacity: [0.1, 0.18, 0.1] }}
            transition={pulse}
          />
        </g>
        <g className="text-secondary">
          <motion.circle
            cx="400"
            cy="70"
            r="56"
            fill="currentColor"
            fillOpacity="0.12"
            initial={false}
            animate={reduce ? {} : { scale: [1, 1.08, 1], fillOpacity: [0.08, 0.16, 0.08] }}
            transition={{ ...pulse, delay: 0.8 }}
          />
        </g>

        <motion.path
          d="M 120 200 Q 200 120 280 160 T 380 200"
          className="stroke-primary"
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.4"
          strokeDasharray="8 10"
          vectorEffect="non-scaling-stroke"
          initial={reduce ? { pathLength: 1 } : { pathLength: 0, opacity: 0.5 }}
          animate={reduce ? {} : { pathLength: 1, opacity: [0.35, 0.8, 0.35] }}
          transition={
            reduce
              ? {}
              : {
                  pathLength: { duration: 2.2, ease: "easeOut" },
                  opacity: { duration: 4, repeat: Infinity },
                }
          }
        />
        <motion.path
          d="M 160 260 L 300 220 L 340 300"
          className="stroke-secondary"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.45"
          strokeDasharray="6 8"
          vectorEffect="non-scaling-stroke"
          initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={reduce ? {} : { duration: 2, delay: 0.35, ease: "easeInOut" }}
        />

        <motion.g
          filter="url(#lm-soft)"
          animate={reduce ? {} : { y: [0, -6, 0] }}
          transition={float}
        >
          <rect
            x="196"
            y="168"
            width="88"
            height="88"
            rx="20"
            className="fill-base-100 stroke-base-content/25"
            strokeWidth="2"
          />
          <path
            d="M 228 210 h 24 M 240 198 v 24"
            className="stroke-primary"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeOpacity="0.7"
          />
        </motion.g>

        <motion.g
          animate={reduce ? {} : { y: [0, -10, 0] }}
          transition={{ ...float, delay: 0.25 }}
        >
          <rect
            x="48"
            y="120"
            width="64"
            height="64"
            rx="14"
            className="fill-base-100 stroke-secondary/50"
            strokeWidth="1.5"
          />
          <circle cx="80" cy="152" r="10" className="fill-secondary/20" />
        </motion.g>

        <motion.g
          animate={reduce ? {} : { y: [0, 8, 0] }}
          transition={{ ...float, delay: 0.55 }}
        >
          <rect
            x="360"
            y="100"
            width="64"
            height="64"
            rx="14"
            className="fill-base-100 stroke-primary/45"
            strokeWidth="1.5"
          />
          <path
            d="M 380 130 h 24 M 392 118 v 24"
            className="stroke-primary"
            strokeWidth="2"
            strokeLinecap="round"
            strokeOpacity="0.65"
          />
        </motion.g>

        <motion.g
          animate={reduce ? {} : { y: [0, -7, 0] }}
          transition={{ ...float, delay: 0.85 }}
        >
          <rect
            x="300"
            y="268"
            width="72"
            height="72"
            rx="16"
            className="fill-base-100 stroke-accent/50"
            strokeWidth="1.5"
          />
          <path
            d="M 322 300 h 28 M 336 286 v 28"
            className="stroke-accent"
            strokeWidth="2"
            strokeLinecap="round"
            strokeOpacity="0.65"
          />
        </motion.g>

        <motion.path
          d="M 100 280 h 52 l 8 36 h 140"
          className="stroke-success"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.55"
          fill="none"
          vectorEffect="non-scaling-stroke"
          initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={reduce ? {} : { duration: 2.4, delay: 0.15, ease: "easeOut" }}
        />
        <circle cx="308" cy="316" r="6" className="fill-success" opacity="0.85" />
      </svg>
    </div>
  );
}
