import type { CssDeclaration } from "@/lib/scraper/css";
import type { SpacingTokens } from "@/lib/tokens/types";
import { DEFAULT_SPACING } from "@/lib/tokens/defaults";

/**
 * Spacing extraction.
 *
 * We can't directly read "the base unit" off a CSS file — design systems
 * are a convention on top of the raw `padding: 16px` / `margin: 8px` that
 * browsers actually see. We reverse-engineer it by looking at every spacing
 * declaration in the CSS and running a modular fit:
 *
 *   1. Collect every pixel value from padding/margin/gap declarations.
 *   2. For each candidate unit (4 and 8 are by far the most common), count
 *      how many of the collected values are clean multiples of that unit.
 *   3. Pick the unit with the highest "multiples" ratio. Ties go to 4 (it's
 *      more flexible for micro-adjustments).
 *   4. Derive the scale from the sorted, deduped multiples we observed.
 *
 * Border radius and shadow strength are pulled directly from the common
 * values on cards and buttons.
 */

const SPACING_PROPS = new Set([
  "margin",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "padding",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "gap",
  "column-gap",
  "row-gap",
]);

const RADIUS_PROPS = new Set([
  "border-radius",
  "border-top-left-radius",
  "border-top-right-radius",
  "border-bottom-left-radius",
  "border-bottom-right-radius",
]);

export function extractSpacing(declarations: CssDeclaration[]): SpacingTokens {
  const pixelValues: number[] = [];
  const radiusValues: number[] = [];
  let shadowOpacitySum = 0;
  let shadowCount = 0;

  for (const decl of declarations) {
    if (SPACING_PROPS.has(decl.prop)) {
      for (const token of decl.value.split(/\s+/)) {
        const px = pxOf(token);
        if (px !== null && px >= 0 && px <= 128) pixelValues.push(px);
      }
      continue;
    }
    if (RADIUS_PROPS.has(decl.prop)) {
      const px = pxOf(decl.value.split(/\s+/)[0] ?? "");
      if (px !== null && px >= 0 && px <= 64) radiusValues.push(px);
      continue;
    }
    if (decl.prop === "box-shadow" && decl.value !== "none") {
      // Rough signal: count how many shadows use rgba() with alpha.
      const alphaMatch = decl.value.match(/rgba?\([^)]+,\s*(0?\.\d+|1)\s*\)/);
      if (alphaMatch) {
        shadowOpacitySum += parseFloat(alphaMatch[1]);
        shadowCount += 1;
      } else {
        shadowOpacitySum += 0.1;
        shadowCount += 1;
      }
    }
  }

  const unit = chooseUnit(pixelValues);
  const scale = buildScale(pixelValues, unit);

  const radius = pickMode(radiusValues) ?? DEFAULT_SPACING.radius;
  const shadowStrength =
    shadowCount > 0
      ? clamp01(shadowOpacitySum / shadowCount)
      : DEFAULT_SPACING.shadowStrength;

  return {
    unit,
    scale,
    radius: Math.round(radius),
    shadowStrength: Math.round(shadowStrength * 100) / 100,
  };
}

function pxOf(token: string): number | null {
  const trimmed = token.trim().toLowerCase();
  if (!trimmed || trimmed === "auto" || trimmed === "inherit") return null;
  const num = parseFloat(trimmed);
  if (Number.isNaN(num)) return null;
  if (trimmed.endsWith("px")) return num;
  if (trimmed.endsWith("rem")) return num * 16;
  if (trimmed.endsWith("em")) return num * 16;
  if (/^\d+$/.test(trimmed) && num <= 128) return num;
  return null;
}

function chooseUnit(values: number[]): number {
  if (values.length === 0) return DEFAULT_SPACING.unit;
  const candidates = [4, 8];
  let best = 4;
  let bestScore = -1;
  for (const unit of candidates) {
    let score = 0;
    for (const v of values) {
      if (v === 0) continue;
      if (Math.abs(v - Math.round(v / unit) * unit) < 0.6) score += 1;
    }
    if (score > bestScore || (score === bestScore && unit === 4)) {
      best = unit;
      bestScore = score;
    }
  }
  return best;
}

function buildScale(values: number[], unit: number): number[] {
  if (values.length === 0) return DEFAULT_SPACING.scale;
  const multiples = new Set<number>();
  multiples.add(0);
  multiples.add(0.5);
  for (const v of values) {
    if (v === 0) continue;
    const multiple = v / unit;
    if (multiple > 0 && multiple <= 24) {
      // Round to the nearest 0.5 step.
      multiples.add(Math.round(multiple * 2) / 2);
    }
  }
  const sorted = [...multiples].sort((a, b) => a - b);
  // Keep the most common ~10 steps so the UI doesn't show 40 rows.
  return sorted.slice(0, 12);
}

function pickMode(values: number[]): number | null {
  if (values.length === 0) return null;
  const counts = new Map<number, number>();
  for (const v of values) {
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let best = values[0];
  let bestCount = 0;
  for (const [v, c] of counts) {
    if (c > bestCount) {
      best = v;
      bestCount = c;
    }
  }
  return best;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
