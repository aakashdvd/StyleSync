"use client";

import { useEffect, useState } from "react";
import { HexColorPicker } from "react-colorful";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LockToggle } from "./lock-toggle";
import { useTokenStore } from "@/store/tokens";
import { cn } from "@/lib/utils";
import { pickContrast } from "@/lib/tokens/css-bridge";
import type { ColorTokens } from "@/lib/tokens/types";

const LABELS: Record<keyof ColorTokens, string> = {
  primary: "Primary",
  secondary: "Secondary",
  accent: "Accent",
  background: "Background",
  foreground: "Foreground",
  muted: "Muted",
  border: "Border",
  danger: "Danger",
  success: "Success",
  warning: "Warning",
};

export function ColorTokenCard({ tokenKey }: { tokenKey: keyof ColorTokens }) {
  const path = `colors.${tokenKey}` as const;
  const value =
    useTokenStore((s) => s.resolved?.colors[tokenKey]) ?? "#000000";
  const editToken = useTokenStore((s) => s.editToken);
  const locked = useTokenStore((s) => s.record?.locked.includes(path) ?? false);

  const [open, setOpen] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  function onChange(next: string) {
    setLocalValue(next);
    if (!locked) editToken(path, next);
  }

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 rounded-xl border border-border bg-surface-raised p-3 transition-all",
        locked && "lock-glow border-accent/60",
      )}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            disabled={locked}
            type="button"
            className={cn(
              "relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border shadow-inner transition-transform",
              !locked && "hover:scale-105",
            )}
            style={{ background: value }}
            aria-label={`Edit ${LABELS[tokenKey]} color`}
          >
            <span
              className="text-[10px] font-mono font-semibold"
              style={{ color: pickContrast(value) }}
            >
              {value.slice(1).toUpperCase()}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[232px] p-3" sideOffset={8}>
          <div className="space-y-3">
            <HexColorPicker color={localValue} onChange={onChange} />
            <div className="flex items-center gap-2">
              <input
                value={localValue}
                onChange={(e) => onChange(e.target.value)}
                className="h-8 flex-1 rounded-md border border-border bg-surface px-2 font-mono text-xs uppercase text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                maxLength={7}
              />
              <button
                className="h-8 rounded-md border border-border px-2 text-[11px] font-medium text-muted-foreground hover:bg-muted"
                onClick={() => setOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {LABELS[tokenKey]}
        </div>
        <div className="truncate font-mono text-[12px] text-foreground">
          {value.toUpperCase()}
        </div>
      </div>

      <LockToggle path={path} />
    </div>
  );
}
