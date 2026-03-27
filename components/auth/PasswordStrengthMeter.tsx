"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { HiOutlineCheck, HiOutlineXMark } from "react-icons/hi2";

interface PasswordStrengthMeterProps {
  password: string;
}

interface Rule {
  label: string;
  test: (pw: string) => boolean;
}

const rules: Rule[] = [
  { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { label: "Contains uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "Contains lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { label: "Contains a number", test: (pw) => /[0-9]/.test(pw) },
  { label: "Contains special character", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"] as const;
const strengthColors = [
  "bg-base-300",           // 0 — empty
  "bg-error",              // 1 — Weak
  "bg-warning",            // 2 — Fair
  "bg-info",               // 3 — Good
  "bg-success",            // 4 — Strong
];
const strengthTextColors = [
  "text-muted-foreground",
  "text-error",
  "text-warning",
  "text-info",
  "text-success",
];

function getStrength(password: string): number {
  if (!password) return 0;
  let score = 0;
  for (const rule of rules) {
    if (rule.test(password)) score++;
  }
  // Map 0-5 score to 0-4 strength
  if (score <= 1) return 1;
  if (score <= 2) return 2;
  if (score <= 3) return 3;
  return 4;
}

export default function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const strength = useMemo(() => getStrength(password), [password]);
  const ruleResults = useMemo(() => rules.map((r) => ({ ...r, passed: r.test(password) })), [password]);

  if (!password) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-3 pt-1"
    >
      {/* Strength bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-muted-foreground">Password strength</span>
          <span className={`text-[11px] font-semibold ${strengthTextColors[strength]}`}>
            {strengthLabels[strength]}
          </span>
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                strength >= level ? strengthColors[strength] : "bg-base-300/60"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Rule checklist */}
      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {ruleResults.map(({ label, passed }) => (
          <div
            key={label}
            className={`flex items-center gap-1.5 text-[11px] transition-colors duration-300 ${
              passed ? "text-success" : "text-muted-foreground/60"
            }`}
          >
            {passed ? (
              <HiOutlineCheck className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <HiOutlineXMark className="h-3.5 w-3.5 shrink-0" />
            )}
            {label}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
