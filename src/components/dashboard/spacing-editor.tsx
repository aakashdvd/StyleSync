"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useTokenStore } from "@/store/tokens";
import { LockToggle } from "./lock-toggle";
import { ResetButton } from "./reset-button";
import { Slider } from "@/components/ui/slider";
import { cn, clamp } from "@/lib/utils";

/**
 * Spacing editor.
 *
 * The "drag-to-adjust" visualizer is intentionally literal: a little box
 * inside a bigger box, with a draggable handle on its trailing edge. The
 * gap between the boxes IS the spacing value (in px). Drag the handle →
 * the gap grows/shrinks → the base unit updates.
 *
 * Because each tick of the drag emits a token edit, we render the preview
 * in a separate subtree (the preview canvas writes CSS variables
 * imperatively, so it stays at 60fps).
 */
export function SpacingEditor() {
  const spacing = useTokenStore((s) => s.resolved?.spacing);
  const editToken = useTokenStore((s) => s.editToken);

  if (!spacing) return null;

  const set = <K extends keyof typeof spacing>(key: K, value: (typeof spacing)[K]) => {
    editToken(`spacing.${String(key)}`, value);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
          Rhythm & radius
        </div>
        <ResetButton category="spacing" />
      </div>
      <SpacingUnitVisualizer
        unit={spacing.unit}
        onChange={(value) => set("unit", value)}
      />

      <div className="rounded-xl border border-border bg-surface-raised px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Modular scale
          </div>
          <div className="font-mono text-[11px] text-foreground">
            {spacing.scale.length} steps
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {spacing.scale.map((multiple, i) => {
            const px = multiple * spacing.unit;
            return (
              <div
                key={i}
                className="flex flex-col items-center gap-1 rounded-md border border-border bg-surface px-2 py-1.5 font-mono text-[10px] text-foreground"
              >
                <div
                  className="rounded-sm bg-accent/80"
                  style={{
                    width: `${Math.max(2, px)}px`,
                    height: "6px",
                  }}
                />
                <span>{px}px</span>
              </div>
            );
          })}
        </div>
      </div>

      <RadiusRow value={spacing.radius} onChange={(v) => set("radius", v)} />

      <ShadowStrengthRow
        value={spacing.shadowStrength}
        onChange={(v) => set("shadowStrength", v)}
      />
    </div>
  );
}

function SpacingUnitVisualizer({
  unit,
  onChange,
}: {
  unit: number;
  onChange: (value: number) => void;
}) {
  const locked = useTokenStore((s) =>
    s.record?.locked.includes("spacing.unit") ?? false,
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (locked) return;
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setDragging(true);
    },
    [locked],
  );

  const handlePointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      setDragging(false);
    },
    [],
  );

  useEffect(() => {
    if (!dragging) return;
    function onMove(event: PointerEvent) {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // Map 0..rect.width → base unit 2..16 (sensible range for design systems).
      const x = clamp(event.clientX - rect.left, 0, rect.width);
      const ratio = x / rect.width;
      const next = Math.round(2 + ratio * 14);
      onChange(clamp(next, 2, 16));
    }
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [dragging, onChange]);

  // Render a stack of boxes whose internal padding = unit × multiplier.
  const multipliers = [2, 3, 4, 6];

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface-raised p-4 transition-all",
        locked && "lock-glow border-accent/60",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
          Base unit
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-md border border-border bg-surface px-1.5 py-0.5 font-mono text-[11px] text-foreground">
            {unit}px
          </div>
          <LockToggle path="spacing.unit" />
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative mt-3 select-none overflow-hidden rounded-lg border border-border bg-muted/40 px-3 py-4"
      >
        <div className="flex flex-col gap-2">
          {multipliers.map((m) => (
            <div
              key={m}
              className="flex items-center justify-between rounded-md border border-dashed border-border bg-surface/70 px-3 text-[11px] text-muted-foreground"
              style={{
                paddingTop: unit * (m / 2),
                paddingBottom: unit * (m / 2),
              }}
            >
              <span className="font-mono">{m}×</span>
              <span className="font-mono">{unit * m}px</span>
            </div>
          ))}
        </div>
        <div
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          role="slider"
          aria-label="Drag to adjust base unit"
          aria-valuemin={2}
          aria-valuemax={16}
          aria-valuenow={unit}
          aria-disabled={locked}
          className={cn(
            "absolute right-2 top-1/2 h-14 w-1.5 -translate-y-1/2 cursor-ew-resize rounded-full bg-accent/40 transition-colors hover:bg-accent",
            dragging && "bg-accent",
            locked && "cursor-not-allowed opacity-50",
          )}
        />
      </div>
      <div className="mt-3">
        <Slider
          value={[unit]}
          min={2}
          max={16}
          step={1}
          disabled={locked}
          onValueChange={([v]) => onChange(v)}
        />
      </div>
    </div>
  );
}

function RadiusRow({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const locked = useTokenStore((s) =>
    s.record?.locked.includes("spacing.radius") ?? false,
  );
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface-raised px-4 py-3",
        locked && "lock-glow border-accent/60",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
          Corner radius
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-md border border-border bg-surface px-1.5 py-0.5 font-mono text-[11px] text-foreground">
            {value}px
          </div>
          <LockToggle path="spacing.radius" />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div
          className="h-10 w-10 border border-border bg-accent/80 transition-all"
          style={{ borderRadius: value }}
        />
        <div className="flex-1">
          <Slider
            value={[value]}
            min={0}
            max={32}
            step={1}
            disabled={locked}
            onValueChange={([v]) => onChange(v)}
          />
        </div>
      </div>
    </div>
  );
}

function ShadowStrengthRow({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const locked = useTokenStore((s) =>
    s.record?.locked.includes("spacing.shadowStrength") ?? false,
  );
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface-raised px-4 py-3",
        locked && "lock-glow border-accent/60",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
          Shadow strength
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-md border border-border bg-surface px-1.5 py-0.5 font-mono text-[11px] text-foreground">
            {(value * 100).toFixed(0)}%
          </div>
          <LockToggle path="spacing.shadowStrength" />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-lg bg-surface"
          style={{
            boxShadow: `0 12px 24px -12px rgba(15,23,42,${value * 2.5}), 0 2px 4px rgba(15,23,42,${value})`,
            border: "1px solid hsl(var(--app-border))",
          }}
        />
        <div className="flex-1">
          <Slider
            value={[value]}
            min={0}
            max={0.5}
            step={0.01}
            disabled={locked}
            onValueChange={([v]) => onChange(v)}
          />
        </div>
      </div>
    </div>
  );
}
