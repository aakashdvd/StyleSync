"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { useTokenStore } from "@/store/tokens";
import {
  toCssVariables,
  toJsonTokens,
  toTailwindConfig,
} from "@/lib/tokens/export";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Format = "css" | "json" | "tailwind";

const EXTENSIONS: Record<Format, string> = {
  css: "tokens.css",
  json: "tokens.json",
  tailwind: "tailwind.config.js",
};

export function ExportPanel() {
  const resolved = useTokenStore((s) => s.resolved);
  const [copied, setCopied] = useState<Format | null>(null);

  const formats = useMemo(() => {
    if (!resolved) return null;
    return {
      css: toCssVariables(resolved),
      json: toJsonTokens(resolved),
      tailwind: toTailwindConfig(resolved),
    } satisfies Record<Format, string>;
  }, [resolved]);

  if (!formats) return null;

  async function copy(format: Format) {
    try {
      await navigator.clipboard.writeText(formats![format]);
      setCopied(format);
      toast.success(`${format.toUpperCase()} copied`);
      setTimeout(() => setCopied(null), 1400);
    } catch {
      toast.error("Clipboard blocked — try download instead");
    }
  }

  function download(format: Format) {
    const blob = new Blob([formats![format]], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = EXTENSIONS[format];
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <Tabs defaultValue="css" className="w-full">
      <div className="flex items-center justify-between gap-3">
        <TabsList>
          <TabsTrigger value="css">CSS variables</TabsTrigger>
          <TabsTrigger value="json">JSON tokens</TabsTrigger>
          <TabsTrigger value="tailwind">Tailwind</TabsTrigger>
        </TabsList>
      </div>
      {(Object.keys(formats) as Format[]).map((format) => (
        <TabsContent key={format} value={format} className="mt-3">
          <div className="relative rounded-xl border border-border bg-surface">
            <pre className="thin-scroll max-h-72 overflow-auto p-4 font-mono text-[11px] leading-5 text-foreground">
              {formats[format]}
            </pre>
            <div className="absolute right-2 top-2 flex gap-1.5">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => copy(format)}
                className="h-7 px-2 text-[11px]"
              >
                {copied === format ? (
                  <>
                    <Check className="size-3" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-3" /> Copy
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => download(format)}
                className="h-7 px-2 text-[11px]"
              >
                <Download className="size-3" /> Download
              </Button>
            </div>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
