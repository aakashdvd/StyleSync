"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useTokenStore } from "@/store/tokens";

/**
 * Background sync for token edits.
 *
 * Watches the store's `dirtyPaths` set and flushes each edit to the server
 * on a short debounce. Debouncing matters because a color picker drag emits
 * dozens of updates per second; we keep the UI perfectly responsive and
 * coalesce network traffic.
 */
const DEBOUNCE_MS = 240;

export function useTokenSync() {
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const unsubscribe = useTokenStore.subscribe(
      (s) => s.dirtyPaths,
      (dirty) => {
        if (dirty.size === 0) return;
        const { siteId, record, markClean, setSaving } = useTokenStore.getState();
        if (!siteId || !record) return;

        for (const path of dirty) {
          const existing = timers.current.get(path);
          if (existing) clearTimeout(existing);

          const timer = setTimeout(async () => {
            timers.current.delete(path);
            const [category, key] = path.split(".") as [string, string];
            const layer = (record as any)[category];
            const overrideValue = layer?.overrides?.[key];

            setSaving(true);
            try {
              const res = await fetch(`/api/sites/${siteId}/tokens`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ path, value: overrideValue }),
              });
              if (!res.ok) {
                const payload = await res.json().catch(() => ({}));
                toast.error(payload?.error?.message || "Could not save token");
              } else {
                markClean(path);
              }
            } catch {
              toast.error("Network error while saving");
            } finally {
              setSaving(false);
            }
          }, DEBOUNCE_MS);

          timers.current.set(path, timer);
        }
      },
    );
    return () => {
      unsubscribe();
      for (const t of timers.current.values()) clearTimeout(t);
      timers.current.clear();
    };
  }, []);
}
