import type {
  ColorTokens,
  SpacingTokens,
  TokenLayer,
  TokenSet,
  TokenSetRecord,
  TypographyTokens,
} from "./types";

/**
 * Resolve a single layered category ({ extracted, overrides }) into the final
 * values the UI will render. Overrides always win when present.
 */
export function resolveLayer<T extends Record<string, unknown>>(
  layer: TokenLayer<T>,
): T {
  return { ...layer.extracted, ...layer.overrides };
}

/** Merge a persisted record into a flat, renderable {@link TokenSet}. */
export function resolveTokenSet(record: TokenSetRecord): TokenSet {
  return {
    colors: resolveLayer(record.colors),
    typography: resolveLayer(record.typography),
    spacing: resolveLayer(record.spacing),
  };
}

/**
 * Update a single token path ("colors.primary") in a record, producing a new
 * record. Respects the lock rules:
 *
 *   - If the path is locked, the write is a no-op (the caller should unlock
 *     first). This is a safety rail — the UI already prevents editing locked
 *     tokens, but we enforce it at the data layer too so a misbehaving client
 *     can't sneak past it.
 */
export function setTokenValue(
  record: TokenSetRecord,
  path: string,
  value: unknown,
): TokenSetRecord {
  if (record.locked.includes(path)) return record;

  const [category, key] = path.split(".");
  if (!category || !key) return record;

  const next: TokenSetRecord = structuredClone(record);
  const layer = (next as any)[category] as TokenLayer<any> | undefined;
  if (!layer || !("overrides" in layer)) return record;

  layer.overrides = { ...layer.overrides, [key]: value };
  return next;
}

/**
 * Merge a freshly scraped token set into an existing persisted record,
 * preserving locked token paths. This is the "re-scrape" codepath:
 *
 *   1. For every category, start from the new extraction.
 *   2. Walk the lock list. For each locked path, restore the previous value
 *      (whether that came from an override or from the previous extraction).
 *   3. Keep any user overrides on unlocked paths — the user clearly wanted
 *      them; re-scraping shouldn't wipe edits they haven't explicitly reset.
 */
export function mergeRescrape(
  previous: TokenSetRecord,
  fresh: {
    colors: ColorTokens;
    typography: TypographyTokens;
    spacing: SpacingTokens;
    meta: TokenSetRecord["meta"];
  },
): TokenSetRecord {
  const merged: TokenSetRecord = {
    colors: {
      extracted: fresh.colors,
      overrides: { ...previous.colors.overrides },
    },
    typography: {
      extracted: fresh.typography,
      overrides: { ...previous.typography.overrides },
    },
    spacing: {
      extracted: fresh.spacing,
      overrides: { ...previous.spacing.overrides },
    },
    meta: fresh.meta,
    locked: [...previous.locked],
  };

  for (const path of previous.locked) {
    const [category, key] = path.split(".") as [string, string];
    const prevLayer = (previous as any)[category] as TokenLayer<any> | undefined;
    const nextLayer = (merged as any)[category] as TokenLayer<any> | undefined;
    if (!prevLayer || !nextLayer) continue;

    // Whatever the user was seeing at the moment they locked it — that's the
    // frozen value. That's either their override OR the previous extracted
    // value if they never edited it.
    const frozenValue =
      (prevLayer.overrides as any)?.[key] ?? (prevLayer.extracted as any)?.[key];
    if (frozenValue !== undefined) {
      nextLayer.overrides = { ...nextLayer.overrides, [key]: frozenValue };
    }
  }

  return merged;
}

/** Which token paths changed between two records. Used for version history. */
export function diffTokenPaths(
  a: TokenSetRecord,
  b: TokenSetRecord,
): string[] {
  const paths: string[] = [];
  const categories = ["colors", "typography", "spacing"] as const;
  for (const category of categories) {
    const aResolved = resolveLayer((a as any)[category]);
    const bResolved = resolveLayer((b as any)[category]);
    const keys = new Set([...Object.keys(aResolved), ...Object.keys(bResolved)]);
    for (const key of keys) {
      if (
        JSON.stringify((aResolved as any)[key]) !==
        JSON.stringify((bResolved as any)[key])
      ) {
        paths.push(`${category}.${key}`);
      }
    }
  }
  return paths;
}
