"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Globe } from "lucide-react";
import { hostnameOf, timeAgo } from "@/lib/utils";

interface RecentSite {
  id: string;
  url: string;
  title: string | null;
  faviconUrl: string | null;
  scrapedAt: string;
  tokens: {
    meta: { palette: string[] };
  } | null;
}

/**
 * Displayed on the landing page below the URL form. Shows the 6 most
 * recent extractions so a reviewer can hop straight into a populated
 * dashboard without running a scrape themselves.
 */
export function RecentSites() {
  const [sites, setSites] = useState<RecentSite[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/sites")
      .then((r) => r.json())
      .then((payload) => {
        if (cancelled) return;
        setSites(payload.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setSites([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!sites || sites.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-16">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.14em] text-accent">
            Recent extractions
          </div>
          <h2 className="mt-1 text-xl font-semibold text-foreground">
            Jump into a live token set
          </h2>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {sites.slice(0, 6).map((site) => {
          const palette = site.tokens?.meta?.palette?.slice(0, 5) ?? [];
          return (
            <Link
              key={site.id}
              href={`/dashboard/${site.id}`}
              className="group flex flex-col gap-3 rounded-xl border border-border bg-surface-raised p-4 transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-[0_24px_60px_-36px_hsl(var(--app-accent)/0.5)]"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-md border border-border bg-surface">
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
                    <Globe className="size-3 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">
                    {site.title ?? hostnameOf(site.url)}
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {hostnameOf(site.url)} · {timeAgo(site.scrapedAt)}
                  </div>
                </div>
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
              </div>
              <div className="flex h-6 overflow-hidden rounded-md">
                {palette.length === 0 ? (
                  <div className="flex-1 bg-muted" />
                ) : (
                  palette.map((hex, i) => (
                    <div
                      key={`${hex}-${i}`}
                      className="flex-1"
                      style={{ background: hex }}
                    />
                  ))
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
