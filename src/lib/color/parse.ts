/**
 * Color utilities — parsing, conversion, and distance.
 *
 * Deliberately dependency-free so the extractor can run in any JS runtime
 * (edge, node, browser). The only third-party piece elsewhere in the
 * pipeline is `node-vibrant`, which is isolated to `lib/color/vibrant.ts`.
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
  /** Optional alpha 0..1. Used when pulling from `rgba()` CSS values. */
  a?: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

const NAMED_COLORS: Record<string, string> = {
  black: "#000000",
  white: "#ffffff",
  red: "#ff0000",
  green: "#008000",
  blue: "#0000ff",
  yellow: "#ffff00",
  cyan: "#00ffff",
  magenta: "#ff00ff",
  gray: "#808080",
  grey: "#808080",
  silver: "#c0c0c0",
  maroon: "#800000",
  olive: "#808000",
  purple: "#800080",
  teal: "#008080",
  navy: "#000080",
  orange: "#ffa500",
  pink: "#ffc0cb",
  brown: "#a52a2a",
  transparent: "rgba(0,0,0,0)",
};

/** Parse any CSS color expression into an RGB object (null on failure). */
export function parseColor(input: string): RGB | null {
  if (!input) return null;
  const value = input.trim().toLowerCase();

  if (value === "inherit" || value === "currentcolor" || value === "transparent") {
    return null;
  }

  if (NAMED_COLORS[value]) return parseColor(NAMED_COLORS[value]);

  // #rgb / #rrggbb / #rrggbbaa
  if (value.startsWith("#")) {
    const hex = value.slice(1);
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
      };
    }
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
      };
    }
    if (hex.length === 8) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: parseInt(hex.slice(6, 8), 16) / 255,
      };
    }
    return null;
  }

  // rgb() / rgba()
  const rgbMatch = value.match(
    /^rgba?\(\s*(-?\d+(?:\.\d+)?%?)\s*[,\s]\s*(-?\d+(?:\.\d+)?%?)\s*[,\s]\s*(-?\d+(?:\.\d+)?%?)(?:\s*[,/]\s*(-?\d+(?:\.\d+)?%?))?\s*\)$/,
  );
  if (rgbMatch) {
    const [r, g, b] = [rgbMatch[1], rgbMatch[2], rgbMatch[3]].map((v) =>
      v.endsWith("%") ? (parseFloat(v) * 255) / 100 : parseFloat(v),
    );
    const a =
      rgbMatch[4] !== undefined
        ? rgbMatch[4].endsWith("%")
          ? parseFloat(rgbMatch[4]) / 100
          : parseFloat(rgbMatch[4])
        : undefined;
    return { r: clampByte(r), g: clampByte(g), b: clampByte(b), a };
  }

  // hsl() / hsla()
  const hslMatch = value.match(
    /^hsla?\(\s*(-?\d+(?:\.\d+)?)(?:deg)?\s*[,\s]\s*(-?\d+(?:\.\d+)?)%\s*[,\s]\s*(-?\d+(?:\.\d+)?)%(?:\s*[,/]\s*(-?\d+(?:\.\d+)?%?))?\s*\)$/,
  );
  if (hslMatch) {
    return hslToRgb({
      h: parseFloat(hslMatch[1]),
      s: parseFloat(hslMatch[2]) / 100,
      l: parseFloat(hslMatch[3]) / 100,
    });
  }

  return null;
}

export function rgbToHex({ r, g, b }: RGB): string {
  const toHex = (n: number) =>
    clampByte(n).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function hslToRgb({ h, s, l }: HSL): RGB {
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

export function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      case bn:
        h = (rn - gn) / d + 4;
        break;
    }
    h *= 60;
  }
  return { h, s, l };
}

/** Relative luminance (WCAG). */
export function luminance({ r, g, b }: RGB): number {
  const transform = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * transform(r) + 0.7152 * transform(g) + 0.0722 * transform(b);
}

export function contrastRatio(a: RGB, b: RGB): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [lighter, darker] = la > lb ? [la, lb] : [lb, la];
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Perceptual distance in Lab-ish space. We don't fully convert to Lab — a
 * weighted RGB distance is close enough for picking near-duplicates and
 * costs nothing. Used to dedupe the raw color frequency table.
 */
export function colorDistance(a: RGB, b: RGB): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  const rMean = (a.r + b.r) / 2;
  return Math.sqrt(
    (2 + rMean / 256) * dr * dr +
      4 * dg * dg +
      (2 + (255 - rMean) / 256) * db * db,
  );
}

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}
