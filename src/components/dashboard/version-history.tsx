"use client";

import { useEffect, useState } from "react";
import {
  History as HistoryIcon,
  Lock,
  Pencil,
  RotateCcw,
  Unlock,
} from "lucide-react";
import { toast } from "sonner";
import { useTokenStore } from "@/store/tokens";
import { timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { TokenSetRecord } from "@/lib/tokens/types";

interface VersionRow {
  id: string;
  version: number;
  label: string | null;
  changeType: string;
  changedPaths: string[];
  createdAt: string;
  snapshot: TokenSetRecord;
}

export function VersionHistory() {
  const siteId = useTokenStore((s) => s.siteId);
  const setLocalRecord = useTokenStore((s) => s.setLocalRecord);
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [reverting, setReverting] = useState<number | null>(null);

  useEffect(() => {
    if (!siteId) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/sites/${siteId}/versions`);
        const payload = await res.json();
        if (!cancelled && payload?.data) setVersions(payload.data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [siteId]);

  async function onRevert(version: number) {
    if (!siteId) return;
    setReverting(version);
    try {
      const res = await fetch(`/api/sites/${siteId}/revert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version }),
      });
      const payload = await res.json();
      if (res.ok && payload.data?.tokens) {
        const tokens = payload.data.tokens;
        setLocalRecord({
          colors: tokens.colors,
          typography: tokens.typography,
          spacing: tokens.spacing,
          meta: tokens.meta,
          locked: tokens.locked,
        });
        toast.success(`Restored to v${version}`);
        // Refresh the version list so the new REVERT row shows up.
        const refreshed = await fetch(`/api/sites/${siteId}/versions`);
        const refreshedPayload = await refreshed.json();
        setVersions(refreshedPayload.data ?? []);
      } else {
        toast.error(payload?.error?.message ?? "Revert failed");
      }
    } finally {
      setReverting(null);
    }
  }

  return (
    <div className="space-y-2">
      {loading && versions.length === 0 && (
        <div className="rounded-lg border border-border bg-surface p-3 text-xs text-muted-foreground">
          Loading history…
        </div>
      )}
      {!loading && versions.length === 0 && (
        <div className="rounded-lg border border-border bg-surface p-3 text-xs text-muted-foreground">
          No changes yet. Edit a token to start versioning.
        </div>
      )}
      {versions.map((row) => (
        <div
          key={row.id}
          className="flex items-start gap-3 rounded-lg border border-border bg-surface px-3 py-2.5"
        >
          <div className="mt-1">{changeIcon(row.changeType)}</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-muted-foreground">
                v{row.version}
              </span>
              <span className="truncate text-[12px] font-medium text-foreground">
                {row.label ?? row.changeType.toLowerCase()}
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              {timeAgo(row.createdAt)}
              {row.changedPaths.length > 0 && (
                <> · {row.changedPaths.slice(0, 2).join(", ")}
                  {row.changedPaths.length > 2 && ` +${row.changedPaths.length - 2}`}
                </>
              )}
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRevert(row.version)}
            disabled={reverting !== null}
            className="h-7 px-2 text-[11px]"
          >
            <RotateCcw className="size-3" />
            {reverting === row.version ? "Reverting…" : "Restore"}
          </Button>
        </div>
      ))}
    </div>
  );
}

function changeIcon(type: string) {
  const className = "size-4 text-muted-foreground";
  if (type === "LOCK") return <Lock className={className} />;
  if (type === "UNLOCK") return <Unlock className={className} />;
  if (type === "SCRAPE") return <HistoryIcon className={className} />;
  if (type === "REVERT") return <RotateCcw className={className} />;
  return <Pencil className={className} />;
}
