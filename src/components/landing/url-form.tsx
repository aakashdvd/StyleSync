"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Globe, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useScrape } from "@/hooks/use-scrape";
import { ScrapeProgress } from "./scrape-progress";
import { normalizeUrl } from "@/lib/utils";

const EXAMPLES = [
  "https://vercel.com",
  "https://linear.app",
  "https://stripe.com",
  "https://notion.so",
  "https://apple.com",
];

export function UrlForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const { status, error, scrape } = useScrape();

  const disabled = status === "scraping";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);
    if (!value.trim()) {
      setLocalError("Paste a URL to get started.");
      return;
    }
    try {
      normalizeUrl(value);
    } catch {
      setLocalError("That doesn't look like a URL.");
      return;
    }
    const siteId = await scrape(value);
    if (siteId) router.push(`/dashboard/${siteId}`);
  }

  return (
    <div className="w-full max-w-2xl">
      <form onSubmit={onSubmit} className="relative">
        <div className="group relative rounded-2xl border border-border bg-surface-raised p-2 shadow-[0_24px_72px_-36px_hsl(var(--app-accent)/0.35)] transition-shadow focus-within:shadow-[0_32px_96px_-32px_hsl(var(--app-accent)/0.55)]">
          <div className="flex items-center gap-2 px-2">
            <Globe className="size-4 text-muted-foreground" />
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="https://your-favorite-site.com"
              disabled={disabled}
              aria-label="Website URL to analyze"
              invalid={Boolean(localError || error)}
              className="h-12 border-0 bg-transparent px-0 text-[15px] focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button type="submit" size="lg" disabled={disabled} className="gap-2">
              {disabled ? (
                <>Parsing…</>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Extract
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      <AnimatePresence mode="popLayout">
        {(localError || error) && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-3 text-sm text-danger"
          >
            {localError ?? error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="uppercase tracking-[0.14em]">Try:</span>
        {EXAMPLES.map((url) => (
          <button
            key={url}
            type="button"
            onClick={() => setValue(url)}
            disabled={disabled}
            className="rounded-full border border-border bg-surface px-3 py-1 text-[11px] font-medium text-foreground transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
          >
            {url.replace(/^https?:\/\//, "")}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {status === "scraping" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="mt-10"
          >
            <ScrapeProgress url={value} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
