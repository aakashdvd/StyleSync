"use client";

import { ColorTokenCard } from "./color-token-card";
import { ResetButton } from "./reset-button";
import { useTokenStore } from "@/store/tokens";
import type { ColorTokens } from "@/lib/tokens/types";

const ORDER: (keyof ColorTokens)[] = [
  "primary",
  "secondary",
  "accent",
  "background",
  "foreground",
  "muted",
  "border",
  "danger",
  "success",
  "warning",
];

export function ColorEditor() {
  const palette = useTokenStore((s) => s.record?.meta.palette ?? []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
          10 tokens
        </div>
        <ResetButton category="colors" />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {ORDER.map((key) => (
          <ColorTokenCard key={key} tokenKey={key} />
        ))}
      </div>

      {palette.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              Extracted palette
            </div>
            <div className="text-[11px] text-muted-foreground">
              {palette.length} swatches
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {palette.map((hex, i) => (
              <PaletteChip hex={hex} key={`${hex}-${i}`} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PaletteChip({ hex }: { hex: string }) {
  return (
    <div className="group relative">
      <div
        className="h-7 w-7 rounded-md border border-border shadow-inner"
        style={{ background: hex }}
      />
      <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 rounded-md border border-border bg-surface-raised px-1.5 py-0.5 font-mono text-[10px] text-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100">
        {hex.toUpperCase()}
      </div>
    </div>
  );
}
