import type { CssDeclaration } from "@/lib/scraper/css";
import {
  colorDistance,
  contrastRatio,
  parseColor,
  rgbToHex,
  rgbToHsl,
  type RGB,
} from "@/lib/color/parse";
import type { VibrantPalette } from "@/lib/color/vibrant";
import type { ColorTokens } from "@/lib/tokens/types";
import { DEFAULT_COLORS } from "@/lib/tokens/defaults";

const COLOR_PROPS = new Set([
  "color",
  "background",
  "background-color",
  "border-color",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
  "fill",
  "stroke",
  "outline-color",
]);

/**
 * Key signals for extraction (ranked by importance):
 *
 *   1. body/root background + foreground — tells us "neutrals".
 *   2. Button/link/CTA colors — tells us the primary brand color.
 *   3. Image-derived palette (via node-vibrant) — fills gaps and breaks ties.
 *   4. Frequency across all declarations — fallback "this color is just
 *      everywhere" signal.
 *
 * We build a weighted table and then pick the winner per slot.
 */
interface ColorHit {
  rgb: RGB;
  weight: number;
  sourcesText: Set<string>;
}

type CssSlot =
  | "background"
  | "foreground"
  | "primary"
  | "secondary"
  | "accent"
  | "border"
  | "muted"
  | "danger"
  | "success"
  | "warning";

interface WeightedTable {
  byHex: Map<string, ColorHit>;
  slots: Partial<Record<CssSlot, RGB>>;
}

function addHit(
  table: WeightedTable,
  rgb: RGB,
  weight: number,
  source: string,
) {
  if ((rgb.a ?? 1) < 0.1) return;
  const hex = rgbToHex(rgb);
  const existing = table.byHex.get(hex);
  if (existing) {
    existing.weight += weight;
    existing.sourcesText.add(source);
    return;
  }
  table.byHex.set(hex, {
    rgb,
    weight,
    sourcesText: new Set([source]),
  });
}

function selectorWeight(selector: string): number {
  const s = selector.toLowerCase();
  if (/(^|\s)body(\s|$|[,{])/.test(s)) return 5;
  if (/(^|\s)html(\s|$|[,{])/.test(s)) return 5;
  if (/\.btn|\.button|button\b|\.cta/.test(s)) return 6;
  if (/\ba\b|\.link/.test(s)) return 3;
  if (/\.primary|\.brand/.test(s)) return 6;
  if (/\.secondary/.test(s)) return 4;
  if (/\.accent|\.highlight/.test(s)) return 4;
  if (/header|nav|hero|banner/.test(s)) return 3;
  return 1;
}

function hintedSlot(
  prop: string,
  selector: string,
): CssSlot | undefined {
  const s = selector.toLowerCase();
  if (prop === "background-color" || prop === "background") {
    if (/(^|\s)body|html/.test(s)) return "background";
    if (/\.btn|\.button|button|\.cta|\.primary|\.brand/.test(s))
      return "primary";
    if (/\.secondary/.test(s)) return "secondary";
    if (/\.accent|\.highlight/.test(s)) return "accent";
    if (/\.error|\.danger|\.destructive/.test(s)) return "danger";
    if (/\.success|\.ok/.test(s)) return "success";
    if (/\.warning|\.warn/.test(s)) return "warning";
    if (/\.muted|\.card|\.surface/.test(s)) return "muted";
  }
  if (prop === "color") {
    if (/(^|\s)body|html/.test(s)) return "foreground";
  }
  if (prop.includes("border")) {
    return "border";
  }
  return undefined;
}

export interface ExtractedColors {
  colors: ColorTokens;
  palette: string[];
  source: "css" | "image" | "mixed";
  confidence: number;
}

/**
 * Turn raw CSS declarations (and optionally a Vibrant palette from the
 * hero image) into a ColorTokens object. Handles three cases cleanly:
 *
 *   - Lots of CSS signal → pick directly from it.
 *   - CSS signal + image palette → use image for primary, CSS for neutrals.
 *   - No CSS signal at all → fall back entirely to the image palette.
 */
export function extractColors(
  declarations: CssDeclaration[],
  imagePalette: VibrantPalette | null,
): ExtractedColors {
  const table: WeightedTable = { byHex: new Map(), slots: {} };

  for (const decl of declarations) {
    if (!COLOR_PROPS.has(decl.prop)) continue;
    // A single value can contain multiple colors (gradients, shadows).
    for (const raw of splitColorValues(decl.value)) {
      const rgb = parseColor(raw);
      if (!rgb) continue;
      const weight = selectorWeight(decl.selector) * (decl.specificity || 1);
      addHit(table, rgb, weight, decl.selector);

      const slot = hintedSlot(decl.prop, decl.selector);
      if (slot && !table.slots[slot]) {
        table.slots[slot] = rgb;
      }
    }
  }

  // Fill missing background/foreground from the sorted frequency list.
  const ranked = [...table.byHex.values()].sort((a, b) => b.weight - a.weight);
  const lightest = ranked
    .filter((h) => luminanceOf(h.rgb) > 0.85)
    .slice(0, 1)[0]?.rgb;
  const darkest = ranked
    .filter((h) => luminanceOf(h.rgb) < 0.2)
    .slice(0, 1)[0]?.rgb;

  const background =
    table.slots.background ??
    lightest ??
    imagePalette?.lightVibrant ??
    parseColor(DEFAULT_COLORS.background)!;

  const foreground =
    table.slots.foreground ??
    darkest ??
    imagePalette?.darkMuted ??
    parseColor(DEFAULT_COLORS.foreground)!;

  // Primary: prefer slot hint, then image vibrant, then the most saturated
  // non-neutral color in the frequency table.
  const mostSaturated = ranked
    .map((h) => ({ hit: h, hsl: rgbToHsl(h.rgb) }))
    .filter(({ hsl }) => hsl.s > 0.25 && hsl.l > 0.2 && hsl.l < 0.85)
    .sort((a, b) => b.hsl.s * b.hit.weight - a.hsl.s * a.hit.weight)[0]?.hit;

  const primary =
    table.slots.primary ??
    imagePalette?.vibrant ??
    mostSaturated?.rgb ??
    imagePalette?.darkVibrant ??
    parseColor(DEFAULT_COLORS.primary)!;

  // Secondary: rotate the primary by ~35° in hue as a safe default, or pull
  // a distinct second saturated color from the table.
  const secondary =
    table.slots.secondary ??
    imagePalette?.lightVibrant ??
    pickDistinct(primary, ranked.map((r) => r.rgb), 80) ??
    rotateHue(primary, 35);

  const accent =
    table.slots.accent ??
    imagePalette?.lightVibrant ??
    rotateHue(primary, 180);

  const border =
    table.slots.border ??
    pickDistinct(background, ranked.map((r) => r.rgb), 30) ??
    darken(background, 0.1);

  const muted =
    table.slots.muted ??
    lighten(background, 0.03) ??
    background;

  const danger =
    table.slots.danger ?? parseColor(DEFAULT_COLORS.danger)!;
  const success =
    table.slots.success ?? parseColor(DEFAULT_COLORS.success)!;
  const warning =
    table.slots.warning ?? parseColor(DEFAULT_COLORS.warning)!;

  // Coherence check: if background & foreground contrast < 4.5 they're not
  // usable. Snap to defaults when that happens.
  if (contrastRatio(background, foreground) < 4.5) {
    const c = chooseNeutrals(ranked.map((r) => r.rgb));
    if (c) {
      return buildResult(
        {
          primary,
          secondary,
          accent,
          background: c.bg,
          foreground: c.fg,
          muted: lighten(c.bg, 0.03),
          border: darken(c.bg, 0.1),
          danger,
          success,
          warning,
        },
        ranked,
        imagePalette,
      );
    }
  }

  return buildResult(
    {
      primary,
      secondary,
      accent,
      background,
      foreground,
      muted,
      border,
      danger,
      success,
      warning,
    },
    ranked,
    imagePalette,
  );
}

function buildResult(
  rgbs: Record<keyof ColorTokens, RGB>,
  ranked: ColorHit[],
  imagePalette: VibrantPalette | null,
): ExtractedColors {
  const colors: ColorTokens = Object.fromEntries(
    Object.entries(rgbs).map(([k, v]) => [k, rgbToHex(v)]),
  ) as unknown as ColorTokens;

  const palette: string[] = [];
  const seen = new Set<string>();
  const push = (rgb?: RGB) => {
    if (!rgb) return;
    const hex = rgbToHex(rgb);
    if (seen.has(hex)) return;
    seen.add(hex);
    palette.push(hex);
  };

  // Primary slots first for the palette strip.
  for (const value of Object.values(colors)) {
    if (!seen.has(value)) {
      seen.add(value);
      palette.push(value);
    }
  }
  if (imagePalette) {
    push(imagePalette.vibrant);
    push(imagePalette.darkVibrant);
    push(imagePalette.lightVibrant);
    push(imagePalette.muted);
    push(imagePalette.darkMuted);
    push(imagePalette.lightMuted);
  }
  for (const hit of ranked.slice(0, 10)) push(hit.rgb);

  const hasCss = ranked.length > 5;
  const hasImage = Boolean(imagePalette?.vibrant);
  const source: ExtractedColors["source"] =
    hasCss && hasImage ? "mixed" : hasImage ? "image" : "css";

  const confidence = Math.min(
    1,
    0.4 + (hasCss ? 0.35 : 0) + (hasImage ? 0.25 : 0),
  );

  return {
    colors,
    palette: palette.slice(0, 12),
    source,
    confidence,
  };
}

function splitColorValues(value: string): string[] {
  // Strip url(...) and var(...) — neither contain literal colors.
  const cleaned = value
    .replace(/url\([^)]*\)/g, " ")
    .replace(/var\([^)]*\)/g, " ");
  const out: string[] = [];
  // Match #hex, rgb/rgba/hsl/hsla, and bare named colors.
  const regex =
    /#[0-9a-f]{3,8}\b|rgba?\([^)]+\)|hsla?\([^)]+\)|\b[a-z]{3,}\b/gi;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(cleaned))) {
    out.push(m[0]);
  }
  return out;
}

function luminanceOf(rgb: RGB): number {
  return rgbToHsl(rgb).l;
}

function rotateHue(rgb: RGB, delta: number): RGB {
  const hsl = rgbToHsl(rgb);
  hsl.h = (hsl.h + delta + 360) % 360;
  return hslToRgbLocal(hsl);
}

function darken(rgb: RGB, amount: number): RGB {
  const hsl = rgbToHsl(rgb);
  hsl.l = Math.max(0, hsl.l - amount);
  return hslToRgbLocal(hsl);
}

function lighten(rgb: RGB, amount: number): RGB {
  const hsl = rgbToHsl(rgb);
  hsl.l = Math.min(1, hsl.l + amount);
  return hslToRgbLocal(hsl);
}

function pickDistinct(
  target: RGB,
  pool: RGB[],
  minDistance: number,
): RGB | undefined {
  for (const c of pool) {
    if (colorDistance(target, c) > minDistance) return c;
  }
  return undefined;
}

function chooseNeutrals(pool: RGB[]): { bg: RGB; fg: RGB } | null {
  const lights = pool.filter((c) => luminanceOf(c) > 0.85);
  const darks = pool.filter((c) => luminanceOf(c) < 0.2);
  if (!lights.length || !darks.length) return null;
  return { bg: lights[0], fg: darks[0] };
}

/**
 * Small local copy of hslToRgb used only inside this module so we don't
 * import a cycle back through `@/lib/color/parse`.
 */
function hslToRgbLocal({ h, s, l }: { h: number; s: number; l: number }): RGB {
  const hue = ((h % 360) + 360) % 360 / 360;
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  return {
    r: Math.round(hue2rgb(hue + 1 / 3) * 255),
    g: Math.round(hue2rgb(hue) * 255),
    b: Math.round(hue2rgb(hue - 1 / 3) * 255),
  };
}
