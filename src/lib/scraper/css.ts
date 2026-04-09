import postcss, { type Declaration, type Rule } from "postcss";
import safeParser from "postcss-safe-parser";
import { safeFetch, ScrapeError } from "./fetch";

/**
 * Parse a blob of CSS (robust to malformed input via postcss-safe-parser)
 * and return a flat list of (selector, prop, value) declarations. Everything
 * downstream — color extraction, typography detection, spacing heuristic —
 * reads from this shape, so it stays decoupled from the CSS AST.
 */
export interface CssDeclaration {
  selector: string;
  prop: string;
  value: string;
  // Specificity is handy for picking "main" vs. "utility" rules.
  specificity: number;
}

export function parseCss(source: string): CssDeclaration[] {
  if (!source || source.trim().length === 0) return [];
  const declarations: CssDeclaration[] = [];
  let root;
  try {
    root = postcss.parse(source, { parser: safeParser });
  } catch {
    return [];
  }

  root.walkRules((rule: Rule) => {
    // Skip at-rules that don't describe normal elements (e.g. @font-face is
    // handled elsewhere).
    if (rule.selector.startsWith("@")) return;
    const specificity = quickSpecificity(rule.selector);
    rule.walkDecls((decl: Declaration) => {
      declarations.push({
        selector: rule.selector,
        prop: decl.prop.toLowerCase(),
        value: decl.value.trim(),
        specificity,
      });
    });
  });

  return declarations;
}

/**
 * Extract every `@font-face` block — these tell us what custom fonts the
 * page is actually loading, which is way more reliable than reading
 * `font-family` values.
 */
export function extractFontFaces(source: string): string[] {
  const fonts = new Set<string>();
  if (!source) return [];
  let root;
  try {
    root = postcss.parse(source, { parser: safeParser });
  } catch {
    return [];
  }
  root.walkAtRules("font-face", (atRule) => {
    atRule.walkDecls("font-family", (decl) => {
      const name = decl.value.replace(/^["']|["']$/g, "").trim();
      if (name) fonts.add(name);
    });
  });
  return [...fonts];
}

/**
 * Fetch + concatenate every linked stylesheet for a document. Silently
 * drops any sheet that fails (individual sheets often fail due to CORS or
 * auth); the caller still has inline styles to work with.
 */
export async function fetchStylesheets(
  urls: string[],
  referer: string,
  opts: { limit?: number; perSheetTimeoutMs?: number } = {},
): Promise<string> {
  const limit = Math.min(urls.length, opts.limit ?? 8);
  const out: string[] = [];
  const slice = urls.slice(0, limit);

  const results = await Promise.allSettled(
    slice.map((url) =>
      safeFetch(url, {
        referer,
        timeoutMs: opts.perSheetTimeoutMs ?? 6_000,
        accept: "text/css,*/*;q=0.1",
      }),
    ),
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      try {
        out.push(result.value.text());
      } catch {
        /* skip unreadable */
      }
    } else if (result.reason instanceof ScrapeError) {
      // Expected — external stylesheets fail all the time due to CORS etc.
      continue;
    }
  }

  return out.join("\n\n");
}

/**
 * Approximate CSS specificity as a single integer. We only need it for
 * ordering (higher = more specific), not exact (a, b, c) tuples.
 */
function quickSpecificity(selector: string): number {
  let score = 0;
  for (const part of selector.split(/[\s>+~]/)) {
    if (!part) continue;
    if (part.startsWith("#")) score += 100;
    else if (part.startsWith(".") || part.includes("[")) score += 10;
    else score += 1;
  }
  return score;
}
