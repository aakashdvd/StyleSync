import type { RGB } from "./parse";

/**
 * Thin wrapper around `node-vibrant`. Isolated here so:
 *   - The rest of the color pipeline stays dependency-free.
 *   - We can swap in a different image-palette library without touching
 *     callers (the return shape is ours, not Vibrant's).
 *   - If `node-vibrant` fails to load in a particular runtime (e.g. an edge
 *     worker), the rest of the extractor continues with CSS-only colors.
 */
export interface VibrantPalette {
  /** Most vibrant color in the image. */
  vibrant?: RGB;
  /** Most vibrant dark variant. */
  darkVibrant?: RGB;
  /** Most vibrant light variant. */
  lightVibrant?: RGB;
  /** Muted palette slots — useful for backgrounds / borders. */
  muted?: RGB;
  darkMuted?: RGB;
  lightMuted?: RGB;
}

export async function extractPalette(
  buffer: Buffer,
): Promise<VibrantPalette | null> {
  try {
    const mod = await import("node-vibrant");
    const Vibrant = (mod as any).default ?? mod;
    const palette = await Vibrant.from(buffer).getPalette();

    const asRgb = (swatch: any): RGB | undefined => {
      if (!swatch) return undefined;
      const [r, g, b] = swatch.getRgb();
      return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
    };

    return {
      vibrant: asRgb(palette.Vibrant),
      darkVibrant: asRgb(palette.DarkVibrant),
      lightVibrant: asRgb(palette.LightVibrant),
      muted: asRgb(palette.Muted),
      darkMuted: asRgb(palette.DarkMuted),
      lightMuted: asRgb(palette.LightMuted),
    };
  } catch (err) {
    console.warn("[stylesync] node-vibrant extraction failed:", err);
    return null;
  }
}
