"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Lock, Unlock } from "lucide-react";
import { useTokenStore } from "@/store/tokens";
import { cn } from "@/lib/utils";

/**
 * Lock toggle for a single token path. The morph between the Lock and
 * Unlock icon is deliberate — the assessment asks for a "satisfying toggle
 * state" with a "padlock icon that morphs".
 *
 * Also fires the server-side lock endpoint on toggle so the state survives
 * re-scraping.
 */
export function LockToggle({
  path,
  className,
}: {
  path: string;
  className?: string;
}) {
  const locked = useTokenStore((s) => s.record?.locked.includes(path) ?? false);
  const toggleLock = useTokenStore((s) => s.toggleLock);
  const siteId = useTokenStore((s) => s.siteId);

  async function onToggle() {
    toggleLock(path);
    if (!siteId) return;
    try {
      await fetch(`/api/sites/${siteId}/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, locked: !locked }),
      });
    } catch {
      // Optimistic update already applied; the next refresh will reconcile.
    }
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={locked}
      aria-label={locked ? "Unlock token" : "Lock token"}
      className={cn(
        "relative inline-flex h-7 w-7 items-center justify-center rounded-md border text-muted-foreground transition-all",
        locked
          ? "border-accent/70 bg-accent/10 text-accent"
          : "border-transparent hover:border-border hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {locked ? (
          <motion.span
            key="locked"
            initial={{ scale: 0.5, rotate: -90, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.5, rotate: 90, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 24 }}
          >
            <Lock className="size-3.5" />
          </motion.span>
        ) : (
          <motion.span
            key="unlocked"
            initial={{ scale: 0.5, rotate: -90, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.5, rotate: 90, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 24 }}
          >
            <Unlock className="size-3.5" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
