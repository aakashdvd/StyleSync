import * as cheerio from "cheerio";

/**
 * Thin wrapper around Cheerio that extracts the handful of document-level
 * facts we care about. Kept separate from the CSS and color extractors so
 * each stage has a single, testable input.
 */
export interface HtmlDocument {
  $: cheerio.CheerioAPI;
  title: string | null;
  description: string | null;
  faviconUrl: string | null;
  ogImageUrl: string | null;
  baseUrl: string;
  /** Every <link rel="stylesheet"> href, resolved against baseUrl. */
  stylesheetUrls: string[];
  /** Every inline <style> block, concatenated in document order. */
  inlineStyles: string;
  /** DOM size (total elements) — cheap proxy for "page complexity". */
  nodeCount: number;
}

export function parseHtml(html: string, baseUrl: string): HtmlDocument {
  const $ = cheerio.load(html);

  // Respect <base href> if present.
  const baseHrefAttr = $("base[href]").attr("href");
  let resolvedBase = baseUrl;
  if (baseHrefAttr) {
    try {
      resolvedBase = new URL(baseHrefAttr, baseUrl).toString();
    } catch {
      /* ignore bad <base> tags */
    }
  }

  const title = ($("title").first().text() || null)?.trim() || null;

  const description =
    $('meta[name="description"]').attr("content")?.trim() ||
    $('meta[property="og:description"]').attr("content")?.trim() ||
    null;

  const favicon =
    $('link[rel~="icon"]').attr("href") ||
    $('link[rel="shortcut icon"]').attr("href") ||
    $('link[rel="apple-touch-icon"]').attr("href") ||
    "/favicon.ico";

  const ogImage =
    $('meta[property="og:image"]').attr("content") ||
    $('meta[name="twitter:image"]').attr("content") ||
    null;

  const stylesheetUrls = $("link[rel='stylesheet'][href]")
    .map((_, el) => $(el).attr("href") || "")
    .get()
    .filter(Boolean)
    .map((href) => safeResolve(href, resolvedBase))
    .filter((url): url is string => Boolean(url));

  const inlineStyles = $("style")
    .map((_, el) => $(el).text() || "")
    .get()
    .join("\n");

  return {
    $,
    title,
    description,
    faviconUrl: safeResolve(favicon, resolvedBase),
    ogImageUrl: ogImage ? safeResolve(ogImage, resolvedBase) : null,
    baseUrl: resolvedBase,
    stylesheetUrls,
    inlineStyles,
    nodeCount: $("*").length,
  };
}

function safeResolve(href: string, base: string): string | null {
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}
