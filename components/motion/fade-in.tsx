"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

type Props = HTMLMotionProps<"div"> & {
  children: React.ReactNode;
  delay?: number;
  y?: number;
};

export function FadeIn({
  children,
  delay = 0,
  y = 16,
  className,
  ...rest
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-32px" }}
      transition={{
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1] as const,
        delay,
      }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
