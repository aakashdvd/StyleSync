"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useTokenStore } from "@/store/tokens";

/**
 * Re-scrape the current site's URL. Because the server merges fresh tokens
 * into the existing record (preserving locks), the user can keep whatever
 * they've locked and just refresh everything else.
 */
export function RescrapeButton() {
  const router = useRouter();
  const site = useTokenStore((s) => s.site);
  const [loading, setLoading] = useState(false);

  async function onClick() {
    if (!site) return;
    setLoading(true);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: site.url }),
      });
      const payload = await res.json();
      if (res.ok && payload.data?.id) {
        toast.success("Re-scraped — locks preserved");
        router.refresh();
      } else {
        toast.error(payload?.error?.message ?? "Re-scrape failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={onClick}
      disabled={loading}
      className="h-8"
    >
      <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
      Re-scrape
    </Button>
  );
}
