"use client";

import { useTokenStore } from "@/store/tokens";
import { Slider } from "@/components/ui/slider";
import { LockToggle } from "./lock-toggle";
import { cn } from "@/lib/utils";
import type { TypographyTokens } from "@/lib/tokens/types";

const FONT_STACKS = [
  "Inter, system-ui, sans-serif",
  "'Geist', system-ui, sans-serif",
  "'IBM Plex Sans', system-ui, sans-serif",
  "'Space Grotesk', system-ui, sans-serif",
  "'Manrope', system-ui, sans-serif",
  "'DM Sans', system-ui, sans-serif",
  "'Fraunces', 'Times New Roman', serif",
  "'Playfair Display', Georgia, serif",
  "'Source Serif 4', Georgia, serif",
  "'JetBrains Mono', ui-monospace, monospace",
];

export function TypographyEditor() {
  const typography = useTokenStore((s) => s.resolved?.typography);
  const editToken = useTokenStore((s) => s.editToken);
  const detected = useTokenStore((s) => s.record?.meta.detectedFonts ?? []);

  if (!typography) return null;

  function set<K extends keyof TypographyTokens>(
    key: K,
    value: TypographyTokens[K],
  ) {
    editToken(`typography.${key}`, value);
  }

  return (
    <div className="space-y-4">
      <FontRow
        label="Heading font"
        path="typography.headingFont"
        value={typography.headingFont}
        detected={detected}
        options={FONT_STACKS}
        onSelect={(v) => set("headingFont", v)}
        specimen={
          <span
            style={{
              fontFamily: typography.headingFont,
              fontSize: 28,
              fontWeight: typography.headingWeight,
              letterSpacing: `${typography.headingTracking}em`,
            }}
          >
            Fast gigs vex quiz
          </span>
        }
      />
      <FontRow
        label="Body font"
        path="typography.bodyFont"
        value={typography.bodyFont}
        detected={detected}
        options={FONT_STACKS}
        onSelect={(v) => set("bodyFont", v)}
        specimen={
          <span
            style={{
              fontFamily: typography.bodyFont,
              fontSize: 15,
              fontWeight: typography.bodyWeight,
              lineHeight: typography.lineHeight,
            }}
          >
            The quick brown fox jumps over the lazy dog — 1234567890.
          </span>
        }
      />

      <NumberSliderRow
        label="Base size"
        unit="px"
        path="typography.baseSize"
        value={typography.baseSize}
        min={12}
        max={22}
        step={1}
        onChange={(v) => set("baseSize", v)}
      />
      <NumberSliderRow
        label="Scale ratio"
        unit="×"
        path="typography.scaleRatio"
        value={typography.scaleRatio}
        min={1.1}
        max={1.75}
        step={0.01}
        onChange={(v) => set("scaleRatio", v)}
      />
      <NumberSliderRow
        label="Line height"
        unit="×"
        path="typography.lineHeight"
        value={typography.lineHeight}
        min={1.1}
        max={2}
        step={0.05}
        onChange={(v) => set("lineHeight", v)}
      />
      <NumberSliderRow
        label="Heading weight"
        unit="wt"
        path="typography.headingWeight"
        value={typography.headingWeight}
        min={300}
        max={900}
        step={100}
        onChange={(v) => set("headingWeight", v)}
      />
      <NumberSliderRow
        label="Body weight"
        unit="wt"
        path="typography.bodyWeight"
        value={typography.bodyWeight}
        min={300}
        max={700}
        step={100}
        onChange={(v) => set("bodyWeight", v)}
      />
      <NumberSliderRow
        label="Heading tracking"
        unit="em"
        path="typography.headingTracking"
        value={typography.headingTracking}
        min={-0.05}
        max={0.1}
        step={0.005}
        onChange={(v) => set("headingTracking", v)}
      />
    </div>
  );
}

function FontRow({
  label,
  path,
  value,
  detected,
  options,
  onSelect,
  specimen,
}: {
  label: string;
  path: string;
  value: string;
  detected: string[];
  options: string[];
  onSelect: (v: string) => void;
  specimen: React.ReactNode;
}) {
  const locked = useTokenStore((s) => s.record?.locked.includes(path) ?? false);
  const merged = Array.from(
    new Set([
      ...detected.filter((d) => /^[A-Za-z]/.test(d)).map((d) => `'${d}', sans-serif`),
      ...options,
    ]),
  );

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface-raised p-4 transition-all",
        locked && "lock-glow border-accent/60",
      )}
    >
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
          {label}
        </label>
        <LockToggle path={path} />
      </div>
      <select
        disabled={locked}
        value={value}
        onChange={(e) => onSelect(e.target.value)}
        className="mt-2 h-9 w-full rounded-md border border-border bg-surface px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      >
        {merged.map((stack) => (
          <option key={stack} value={stack}>
            {stack}
          </option>
        ))}
      </select>
      <div className="mt-3 rounded-lg border border-border bg-muted/40 p-4 text-foreground">
        {specimen}
      </div>
    </div>
  );
}

function NumberSliderRow({
  label,
  unit,
  path,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  unit: string;
  path: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  const locked = useTokenStore((s) => s.record?.locked.includes(path) ?? false);
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface-raised px-4 py-3",
        locked && "lock-glow border-accent/60",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
          {label}
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-md border border-border bg-surface px-1.5 py-0.5 font-mono text-[11px] text-foreground">
            {value.toFixed(step < 1 ? 2 : 0)} {unit}
          </div>
          <LockToggle path={path} />
        </div>
      </div>
      <div className="mt-2">
        <Slider
          value={[value]}
          min={min}
          max={max}
          step={step}
          disabled={locked}
          onValueChange={([v]) => onChange(v)}
        />
      </div>
    </div>
  );
}
