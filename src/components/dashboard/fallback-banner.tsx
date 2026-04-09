import { AlertTriangle } from "lucide-react";

const REASONS: Record<string, string> = {
  blocked: "This site blocked our scanner",
  timeout: "The site took too long to respond",
  network: "We couldn't reach the site",
  too_large: "The page exceeded our fetch size cap",
  invalid_url: "That URL doesn't look valid",
  http_error: "The site returned a non-2xx status",
  unsupported_content: "The site didn't return HTML",
  low_css_signal: "The page returned very little usable CSS",
  fallback_mode_enabled: "Fallback mode is enabled via environment config",
};

export function FallbackBanner({ reason }: { reason: string | null }) {
  const message = (reason && REASONS[reason]) ?? "We couldn't read this site";
  return (
    <div className="flex items-start gap-3 border-b border-warning/30 bg-warning/10 px-6 py-3 text-sm text-warning">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <div>
        <div className="font-medium text-foreground">{message}</div>
        <div className="text-[12px] text-muted-foreground">
          You're looking at a hand-crafted starter theme. Edit any token below
          — it'll save exactly the same way as a real extraction.
        </div>
      </div>
    </div>
  );
}
