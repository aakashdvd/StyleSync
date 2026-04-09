"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { useTokenStore } from "@/store/tokens";
import { SiteMark } from "@/components/landing/site-mark";
import { Badge } from "@/components/ui/badge";
import { hostnameOf, timeAgo } from "@/lib/utils";
import { RescrapeButton } from "./rescrape-button";

export function DashboardHeader() {
  const site = useTokenStore((s) => s.site);
  const saving = useTokenStore((s) => s.isSaving);
  const confidence = useTokenStore((s) => s.record?.meta.confidence ?? 0);

  if (!site) return null;

  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-surface/80 px-6 py-3 backdrop-blur">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Back to landing"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <SiteMark subtle />
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-md border border-border bg-surface-raised">
          {site.faviconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={site.faviconUrl}
              alt=""
              className="size-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <span className="text-[10px] font-mono text-muted-foreground">
              {hostnameOf(site.url).slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="truncate text-sm font-semibold text-foreground">
              {site.title ?? hostnameOf(site.url)}
            </div>
            <StatusBadge status={site.status} reason={site.statusReason} />
          </div>
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 truncate text-[11px] text-muted-foreground hover:text-foreground"
          >
            {site.url}
            <ExternalLink className="size-3" />
          </a>
        </div>
      </div>

      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
        <motion.div
          initial={false}
          animate={{ opacity: saving ? 1 : 0.7 }}
          className="inline-flex items-center gap-1"
        >
          {saving ? (
            <>
              <Loader2 className="size-3 animate-spin" /> Saving…
            </>
          ) : (
            <>
              <CheckCircle2 className="size-3 text-success" /> Saved
            </>
          )}
        </motion.div>
        <div className="hidden md:block">
          Confidence {(confidence * 100).toFixed(0)}%
        </div>
        <div className="hidden md:block">
          Scraped {timeAgo(site.scrapedAt)}
        </div>
        <RescrapeButton />
      </div>
    </header>
  );
}

function StatusBadge({
  status,
  reason,
}: {
  status: string;
  reason: string | null;
}) {
  if (status === "SUCCESS") {
    return <Badge variant="success">Live extraction</Badge>;
  }
  if (status === "PARTIAL") {
    return <Badge variant="warning">Partial</Badge>;
  }
  if (status === "FALLBACK") {
    return (
      <Badge variant="danger" title={reason ?? undefined}>
        Fallback
      </Badge>
    );
  }
  return <Badge>{status}</Badge>;
}
