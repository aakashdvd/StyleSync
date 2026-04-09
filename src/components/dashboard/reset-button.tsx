"use client";

import { useState } from "react";
import { Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useTokenStore } from "@/store/tokens";
import type { TokenSetRecord } from "@/lib/tokens/types";

/**
 * "Reset to extracted" — clears all overrides on unlocked categories and
 * writes a new version. Locked tokens stay frozen. Useful for when the
 * user has been tweaking colors and wants to get back to the scraped
 * starting point.
 */
export function ResetButton({ category }: { category: "colors" | "typography" | "spacing" }) {
  const siteId = useTokenStore((s) => s.siteId);
  const record = useTokenStore((s) => s.record);
  const setLocalRecord = useTokenStore((s) => s.setLocalRecord);
  const [loading, setLoading] = useState(false);

  const hasOverrides =
    record && Object.keys((record as any)[category].overrides ?? {}).length > 0;

  async function onClick() {
    if (!siteId || !record) return;
    setLoading(true);

    // Build a fresh record with this category's overrides cleared — except
    // for any keys that are currently locked, which stay.
    const currentLayer = (record as any)[category] as TokenSetRecord["colors"];
    const lockedKeys = new Set(
      record.locked
        .filter((p) => p.startsWith(`${category}.`))
        .map((p) => p.split(".")[1]),
    );
    const preservedOverrides: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(currentLayer.overrides)) {
      if (lockedKeys.has(k)) preservedOverrides[k] = v;
    }

    const next: TokenSetRecord = {
      ...record,
      [category]: {
        extracted: currentLayer.extracted,
        overrides: preservedOverrides,
      },
    } as TokenSetRecord;
    setLocalRecord(next);

    // Write each unlocked, previously-overridden path up to the server
    // with value=undefined (the PATCH endpoint accepts that as a clear).
    const pathsToClear = Object.keys(currentLayer.overrides).filter(
      (k) => !lockedKeys.has(k),
    );
    try {
      await Promise.all(
        pathsToClear.map((key) =>
          fetch(`/api/sites/${siteId}/tokens`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              path: `${category}.${key}`,
              value: (currentLayer.extracted as any)[key],
            }),
          }),
        ),
      );
      toast.success(`Reset ${category} to extracted`);
    } catch {
      toast.error("Reset partially failed");
    } finally {
      setLoading(false);
    }
  }

  if (!hasOverrides) return null;

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={onClick}
      disabled={loading}
      className="h-7 px-2 text-[11px]"
    >
      <Undo2 className="size-3" />
      Reset
    </Button>
  );
}
