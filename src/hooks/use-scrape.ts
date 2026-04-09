"use client";

import { useCallback, useState } from "react";

/**
 * Tiny client hook for POST /api/scrape. Deliberately not generic —
 * there's only one call site and abstracting further would add noise.
 */
export interface ScrapeState {
  status: "idle" | "scraping" | "success" | "error";
  error: string | null;
  siteId: string | null;
}

export function useScrape() {
  const [state, setState] = useState<ScrapeState>({
    status: "idle",
    error: null,
    siteId: null,
  });

  const scrape = useCallback(async (url: string) => {
    setState({ status: "scraping", error: null, siteId: null });
    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const payload = await response.json();
      if (!response.ok || payload.error) {
        const message =
          payload?.error?.message || `Scrape failed (${response.status})`;
        setState({ status: "error", error: message, siteId: null });
        return null;
      }
      const siteId = payload.data?.id as string;
      setState({ status: "success", error: null, siteId });
      return siteId;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setState({ status: "error", error: message, siteId: null });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ status: "idle", error: null, siteId: null });
  }, []);

  return { ...state, scrape, reset };
}
