"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SiteMark } from "@/components/landing/site-mark";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[stylesync] global error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <SiteMark />
      <h1 className="mt-10 text-3xl font-semibold tracking-tight text-foreground">
        Something broke
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        We hit an unexpected error rendering this page. Try again, or head back
        to the landing.
      </p>
      {error.digest && (
        <code className="mt-2 rounded-md border border-border bg-surface px-2 py-1 font-mono text-[11px] text-muted-foreground">
          {error.digest}
        </code>
      )}
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>
          <RefreshCw className="size-4" />
          Try again
        </Button>
        <Button asChild variant="secondary">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
