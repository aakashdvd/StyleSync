import { safeFetch, ScrapeError } from "./fetch";
import type { HtmlDocument } from "./html";

/**
 * Identify the handful of "hero" images that most strongly represent the
 * brand — for color-palette extraction. We look for, in order:
 *
 *   1. og:image (highest-signal, usually hand-picked by the site owner)
 *   2. A logo — <img> whose src/alt contains "logo"
 *   3. The first image above the first 2048px of DOM (very rough proxy for
 *      "hero") that isn't an icon or tracking pixel
 */
export function pickHeroImages(doc: HtmlDocument, limit = 3): string[] {
  const { $, baseUrl, ogImageUrl } = doc;
  const picks: string[] = [];

  if (ogImageUrl) picks.push(ogImageUrl);

  $("img").each((_, el) => {
    if (picks.length >= limit + 4) return false;
    const src = $(el).attr("src") || $(el).attr("data-src");
    if (!src) return;
    const alt = ($(el).attr("alt") || "").toLowerCase();
    const className = ($(el).attr("class") || "").toLowerCase();
    const width = parseInt($(el).attr("width") || "0", 10);
    const height = parseInt($(el).attr("height") || "0", 10);

    // Skip obvious trackers / favicons / very small images.
    if (width > 0 && width < 48) return;
    if (height > 0 && height < 48) return;
    if (/pixel|tracker|beacon/.test(src)) return;

    const isLogo = alt.includes("logo") || className.includes("logo");
    const isHero =
      className.includes("hero") ||
      className.includes("banner") ||
      $(el).parents("header").length > 0;

    if (!isLogo && !isHero) return;

    try {
      picks.push(new URL(src, baseUrl).toString());
    } catch {
      /* ignore invalid URLs */
    }
  });

  // Fallback — just grab the first few large-ish images.
  if (picks.length === 0) {
    $("img").each((_, el) => {
      if (picks.length >= limit) return false;
      const src = $(el).attr("src");
      if (!src) return;
      if (src.startsWith("data:")) return;
      try {
        picks.push(new URL(src, baseUrl).toString());
      } catch {
        /* skip */
      }
    });
  }

  // Dedupe while preserving order.
  const seen = new Set<string>();
  return picks
    .filter((url) => {
      if (seen.has(url)) return false;
      seen.add(url);
      return true;
    })
    .slice(0, limit);
}

/**
 * Download an image into a Buffer, with a reasonable size cap. Used by
 * the color extractor so we can hand the bytes off to node-vibrant.
 */
export async function downloadImage(
  url: string,
  referer: string,
): Promise<Buffer | null> {
  try {
    const result = await safeFetch(url, {
      referer,
      accept: "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8,*/*;q=0.5",
      timeoutMs: 8_000,
      maxBytes: 2_500_000,
    });
    return Buffer.from(result.body);
  } catch (err) {
    if (err instanceof ScrapeError) return null;
    throw err;
  }
}
