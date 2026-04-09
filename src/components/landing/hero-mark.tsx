"use client";

import { motion } from "framer-motion";

/**
 * Decorative animated mark for the landing hero — a soft palette of
 * overlapping color blobs that orbit and shift. Deliberately not a logo;
 * the idea is that the landing page itself looks like an "extracted"
 * design system, so the hero piece is all tokens + motion.
 */
export function HeroMark() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
      aria-hidden="true"
    >
      <div className="relative h-[580px] w-[580px]">
        <Blob
          className="left-6 top-6 h-72 w-72 bg-[radial-gradient(circle_at_30%_30%,_#7c3aed,_#4f46e5_60%,_transparent_72%)]"
          delay={0}
        />
        <Blob
          className="right-0 top-16 h-80 w-80 bg-[radial-gradient(circle_at_60%_40%,_#06b6d4,_#0ea5e9_55%,_transparent_72%)]"
          delay={1.2}
        />
        <Blob
          className="bottom-4 left-16 h-80 w-80 bg-[radial-gradient(circle_at_50%_50%,_#ec4899,_#f43f5e_55%,_transparent_72%)]"
          delay={2.4}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_30%,_hsl(var(--app-bg))_78%)]" />
      </div>
    </motion.div>
  );
}

function Blob({ className, delay }: { className: string; delay: number }) {
  return (
    <motion.div
      className={`absolute rounded-full mix-blend-multiply blur-3xl opacity-60 dark:mix-blend-screen dark:opacity-40 ${className}`}
      animate={{
        x: [0, 24, -18, 0],
        y: [0, -16, 20, 0],
      }}
      transition={{
        duration: 18,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    />
  );
}
