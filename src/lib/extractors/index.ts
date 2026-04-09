import { safeFetch, ScrapeError } from "@/lib/scraper/fetch";
import { parseHtml, type HtmlDocument } from "@/lib/scraper/html";
import { extractFontFaces, fetchStylesheets, parseCss } from "@/lib/scraper/css";
import { downloadImage, pickHeroImages } from "@/lib/scraper/images";
import { extractPalette, type VibrantPalette } from "@/lib/color/vibrant";
import { extractColors, type ExtractedColors } from "./colors";
import { extractTypography } from "./typography";
import { extractSpacing } from "./spacing";
import { fallbackRecord } from "./fallbacks";
import type { TokenMeta, TokenSetRecord } from "@/lib/tokens/types";

export interface ExtractionResult {
  status: "SUCCESS" | "PARTIAL" | "FALLBACK";
  statusReason?: string;
  title: string | null;
  description: string | null;
  faviconUrl: string | null;
  htmlSnapshot: string | null;
  record: TokenSetRecord;
}

/**
 * Top-level orchestrator. Pipes `url` → fetch → parse → extract → tokens.
 *
 * The resilience contract:
 *
 *   - Any stage may fail independently.
 *   - Total scrape failure (network, CORS, paywall) → deterministic fallback
 *     template, status `FALLBACK`.
 *   - Partial failure (HTML parsed, but no external CSS or image palette) →
 *     still returns live extraction, status `PARTIAL`.
 *   - Full success → status `SUCCESS`.
 */
export async function extractFromUrl(
  url: string,
): Promise<ExtractionResult> {
  if (process.env.STYLESYNC_FALLBACK_ONLY === "1") {
    return buildFallback(url, "fallback_mode_enabled");
  }

  let doc: HtmlDocument | null = null;
  let htmlSnapshot: string | null = null;

  try {
    const pageResponse = await safeFetch(url, { timeoutMs: 10_000 });
    htmlSnapshot = pageResponse.text();
    doc = parseHtml(htmlSnapshot, pageResponse.url);
  } catch (err) {
    const reason =
      err instanceof ScrapeError ? err.code : "unknown_fetch_error";
    return buildFallback(url, reason);
  }

  // 1. Gather CSS — inline + (best-effort) external stylesheets.
  const externalCss = await fetchStylesheets(doc.stylesheetUrls, doc.baseUrl, {
    limit: 8,
  }).catch(() => "");
  const allCss = `${doc.inlineStyles}\n\n${externalCss}`;
  const declarations = parseCss(allCss);
  const fontFaces = extractFontFaces(allCss);

  // 2. Pick hero images and run node-vibrant.
  const heroUrls = pickHeroImages(doc, 2);
  let imagePalette: VibrantPalette | null = null;
  for (const heroUrl of heroUrls) {
    const buf = await downloadImage(heroUrl, doc.baseUrl);
    if (!buf) continue;
    imagePalette = await extractPalette(buf);
    if (imagePalette?.vibrant) break;
  }

  // 3. Run extractors.
  const colorResult: ExtractedColors = extractColors(declarations, imagePalette);
  const typoResult = extractTypography(declarations, fontFaces);
  const spacing = extractSpacing(declarations);

  // Decide overall status.
  const cssSignal = declarations.length;
  const hasImageSignal = Boolean(imagePalette?.vibrant);
  const isPartial = cssSignal < 20 && !hasImageSignal;
  const status = isPartial ? "PARTIAL" : "SUCCESS";

  const meta: TokenMeta = {
    palette: colorResult.palette,
    accentSource: colorResult.source === "image" ? "image" : "css",
    confidence: colorResult.confidence,
    detectedFonts: typoResult.detectedFonts,
  };

  const record: TokenSetRecord = {
    colors: { extracted: colorResult.colors, overrides: {} },
    typography: { extracted: typoResult.typography, overrides: {} },
    spacing: { extracted: spacing, overrides: {} },
    meta,
    locked: [],
  };

  return {
    status,
    statusReason: isPartial ? "low_css_signal" : undefined,
    title: doc.title,
    description: doc.description,
    faviconUrl: doc.faviconUrl,
    // Cap the HTML snapshot size — we don't need the whole page, just enough
    // to re-run extraction later.
    htmlSnapshot: htmlSnapshot ? htmlSnapshot.slice(0, 400_000) : null,
    record,
  };
}

function buildFallback(url: string, reason: string): ExtractionResult {
  const { record } = fallbackRecord(url, reason);
  return {
    status: "FALLBACK",
    statusReason: reason,
    title: null,
    description: null,
    faviconUrl: null,
    htmlSnapshot: null,
    record,
  };
}
