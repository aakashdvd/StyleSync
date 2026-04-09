import type { CssDeclaration } from "@/lib/scraper/css";
import type { TypographyTokens } from "@/lib/tokens/types";
import { DEFAULT_TYPOGRAPHY } from "@/lib/tokens/defaults";

/**
 * Typography extraction.
 *
 * Strategy:
 *   1. Collect every `font-family` declaration along with a "context weight"
 *      (body > heading > everything else).
 *   2. Pick the highest-weight heading family and body family.
 *   3. Detect the base font size from `html`/`body`, falling back to 16.
 *   4. Compute the scale ratio from the ratio between h1/h2/h3 sizes (with
 *      a safe snap to common musical ratios).
 */

const HEADING_SELECTORS = /\bh[1-6]\b|\.heading|\.title|\.display/;
const BODY_SELECTORS = /\bbody\b|\bhtml\b|\.body|\.text|\.paragraph|\bp\b/;
const MONO_SELECTORS = /\bcode\b|\bpre\b|\bkbd\b|\.mono|\.code/;

const KNOWN_SCALE_RATIOS = [
  1.067, // Minor second
  1.125, // Major second
  1.2, // Minor third
  1.25, // Major third
  1.333, // Perfect fourth
  1.414, // Aug fourth
  1.5, // Perfect fifth
  1.618, // Golden
];

export interface ExtractedTypography {
  typography: TypographyTokens;
  detectedFonts: string[];
}

export function extractTypography(
  declarations: CssDeclaration[],
  fontFaces: string[],
): ExtractedTypography {
  const headingVotes = new Map<string, number>();
  const bodyVotes = new Map<string, number>();
  const monoVotes = new Map<string, number>();
  const sizeByHeading = new Map<string, number>();
  let baseSize = DEFAULT_TYPOGRAPHY.baseSize;
  let baseSizeFound = false;
  let lineHeight = DEFAULT_TYPOGRAPHY.lineHeight;
  let headingWeight = DEFAULT_TYPOGRAPHY.headingWeight;
  let bodyWeight = DEFAULT_TYPOGRAPHY.bodyWeight;
  let headingTracking = DEFAULT_TYPOGRAPHY.headingTracking;

  for (const decl of declarations) {
    const sel = decl.selector.toLowerCase();

    if (decl.prop === "font-family") {
      const family = normalizeFamily(decl.value);
      if (!family) continue;
      if (HEADING_SELECTORS.test(sel)) {
        headingVotes.set(
          family,
          (headingVotes.get(family) ?? 0) + 4 + decl.specificity,
        );
      } else if (BODY_SELECTORS.test(sel)) {
        bodyVotes.set(
          family,
          (bodyVotes.get(family) ?? 0) + 4 + decl.specificity,
        );
      } else if (MONO_SELECTORS.test(sel)) {
        monoVotes.set(
          family,
          (monoVotes.get(family) ?? 0) + 3 + decl.specificity,
        );
      } else {
        // Generic "seen somewhere" fallback — counts for both body and
        // heading weakly.
        headingVotes.set(family, (headingVotes.get(family) ?? 0) + 0.5);
        bodyVotes.set(family, (bodyVotes.get(family) ?? 0) + 0.5);
      }
    }

    if (decl.prop === "font-size") {
      if (/(^|\s)html|(^|\s)body/.test(sel)) {
        const px = sizeToPx(decl.value, baseSize);
        if (px && px >= 12 && px <= 24) {
          baseSize = px;
          baseSizeFound = true;
        }
      }
      const headingMatch = sel.match(/h([1-6])/);
      if (headingMatch) {
        const level = `h${headingMatch[1]}`;
        const px = sizeToPx(decl.value, baseSize);
        if (px) sizeByHeading.set(level, px);
      }
    }

    if (decl.prop === "line-height") {
      if (/(^|\s)body/.test(sel)) {
        const lh = parseLineHeight(decl.value);
        if (lh) lineHeight = lh;
      }
    }

    if (decl.prop === "font-weight") {
      const w = parseWeight(decl.value);
      if (!w) continue;
      if (HEADING_SELECTORS.test(sel)) headingWeight = w;
      if (BODY_SELECTORS.test(sel)) bodyWeight = w;
    }

    if (decl.prop === "letter-spacing" && HEADING_SELECTORS.test(sel)) {
      const ls = parseLetterSpacing(decl.value, baseSize);
      if (ls !== null) headingTracking = ls;
    }
  }

  // Seed heading family votes with known @font-face families if nothing
  // else matched — these are almost always the brand's loaded fonts.
  for (const face of fontFaces) {
    headingVotes.set(face, (headingVotes.get(face) ?? 0) + 2);
    bodyVotes.set(face, (bodyVotes.get(face) ?? 0) + 1);
  }

  const headingFont =
    pickWinner(headingVotes) ?? DEFAULT_TYPOGRAPHY.headingFont;
  const bodyFont = pickWinner(bodyVotes) ?? headingFont;
  const monoFont = pickWinner(monoVotes) ?? DEFAULT_TYPOGRAPHY.monoFont;

  // Compute scale ratio from h1/h2, h2/h3, etc.
  const ratios: number[] = [];
  const levels = ["h1", "h2", "h3", "h4", "h5", "h6"];
  for (let i = 0; i < levels.length - 1; i++) {
    const a = sizeByHeading.get(levels[i]);
    const b = sizeByHeading.get(levels[i + 1]);
    if (a && b && b > 0 && a > b) ratios.push(a / b);
  }
  let scaleRatio = DEFAULT_TYPOGRAPHY.scaleRatio;
  if (ratios.length > 0) {
    const avg =
      ratios.reduce((acc, r) => acc + r, 0) / ratios.length;
    scaleRatio = snapScale(avg);
  }

  const typography: TypographyTokens = {
    headingFont,
    bodyFont,
    monoFont,
    baseSize: baseSizeFound ? baseSize : DEFAULT_TYPOGRAPHY.baseSize,
    scaleRatio,
    lineHeight,
    headingWeight,
    bodyWeight,
    headingTracking,
  };

  const detected = [
    ...headingVotes.keys(),
    ...bodyVotes.keys(),
    ...monoVotes.keys(),
  ];
  const uniqueDetected = [...new Set(detected)];

  return {
    typography,
    detectedFonts: uniqueDetected.slice(0, 12),
  };
}

function normalizeFamily(value: string): string | null {
  if (!value) return null;
  const v = value.split(",")[0]?.trim().replace(/^["']|["']$/g, "");
  if (!v) return null;
  // Strip generic fallbacks from single-value declarations.
  if (/^(serif|sans-serif|monospace|cursive|fantasy|system-ui)$/i.test(v))
    return null;
  return v;
}

function pickWinner(votes: Map<string, number>): string | null {
  if (votes.size === 0) return null;
  let best = "";
  let bestScore = -Infinity;
  for (const [family, score] of votes) {
    if (score > bestScore) {
      bestScore = score;
      best = family;
    }
  }
  return best;
}

function sizeToPx(value: string, base: number): number | null {
  const trimmed = value.trim().toLowerCase();
  const num = parseFloat(trimmed);
  if (Number.isNaN(num)) return null;
  if (trimmed.endsWith("px")) return num;
  if (trimmed.endsWith("rem")) return num * base;
  if (trimmed.endsWith("em")) return num * base;
  if (trimmed.endsWith("%")) return (num / 100) * base;
  if (/^\d+$/.test(trimmed)) return num;
  return null;
}

function parseLineHeight(value: string): number | null {
  const trimmed = value.trim();
  const num = parseFloat(trimmed);
  if (Number.isNaN(num)) return null;
  if (trimmed.endsWith("%")) return num / 100;
  if (trimmed.endsWith("px")) return num / 16;
  return num;
}

function parseWeight(value: string): number | null {
  const trimmed = value.trim().toLowerCase();
  if (trimmed === "normal") return 400;
  if (trimmed === "bold") return 700;
  const num = parseInt(trimmed, 10);
  return Number.isNaN(num) ? null : num;
}

function parseLetterSpacing(value: string, base: number): number | null {
  const trimmed = value.trim().toLowerCase();
  if (trimmed === "normal") return 0;
  const num = parseFloat(trimmed);
  if (Number.isNaN(num)) return null;
  if (trimmed.endsWith("em")) return num;
  if (trimmed.endsWith("px")) return num / base;
  return null;
}

function snapScale(ratio: number): number {
  let best = KNOWN_SCALE_RATIOS[0];
  let bestDistance = Math.abs(ratio - best);
  for (const candidate of KNOWN_SCALE_RATIOS) {
    const d = Math.abs(ratio - candidate);
    if (d < bestDistance) {
      best = candidate;
      bestDistance = d;
    }
  }
  return best;
}
