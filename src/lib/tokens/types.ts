/**
 * Canonical token shape used throughout the app.
 *
 * Each category ({@link ColorTokens}, {@link TypographyTokens}, {@link SpacingTokens})
 * exposes a flat, predictable set of keys. That flatness is deliberate: it means
 * the merge logic (`mergeTokens`) can treat every token path as a single string
 * ("colors.primary"), which in turn makes the UI's "lock this specific token"
 * behavior trivial.
 *
 * The database stores { extracted, overrides } pairs per category; see
 * {@link TokenSetRecord}. The `extracted` half is what the scraper saw. The
 * `overrides` half is whatever the user has edited on top. The {@link TokenSet}
 * type below is the _merged_ view that the UI and preview grid actually render.
 */

export interface ColorTokens {
  /** Primary brand color — usually the most saturated dominant color. */
  primary: string;
  /** Secondary — complementary to primary, used for secondary actions. */
  secondary: string;
  /** Accent — highlight color for small details. */
  accent: string;
  /** Background base — lightest neutral from the palette. */
  background: string;
  /** Foreground / body text color — darkest neutral. */
  foreground: string;
  /** Muted surface (cards, wells). */
  muted: string;
  /** Border color, derived from foreground at low alpha. */
  border: string;
  /** Semantic destructive / error. */
  danger: string;
  /** Semantic success. */
  success: string;
  /** Semantic warning. */
  warning: string;
}

export interface TypographyTokens {
  /** Primary heading typeface — e.g. "Inter, system-ui". */
  headingFont: string;
  /** Body copy typeface. */
  bodyFont: string;
  /** Monospace family for code samples. */
  monoFont: string;
  /** Base font size in px. Scale is derived from this. */
  baseSize: number;
  /** Typographic scale multiplier. 1.2 = minor third, 1.333 = perfect fourth, 1.414 = aug fourth. */
  scaleRatio: number;
  /** Default line height for body. */
  lineHeight: number;
  /** Heading weight. */
  headingWeight: number;
  /** Body weight. */
  bodyWeight: number;
  /** Letter spacing in em for headings. */
  headingTracking: number;
}

export interface SpacingTokens {
  /** Base unit in px. Most design systems pick 4 or 8. */
  unit: number;
  /** Multiplicative scale — [0, 0.5, 1, 2, 3, 4, 6, 8]. */
  scale: number[];
  /** Border radius in px. */
  radius: number;
  /** Shadow scale — opacity of the base black shadow (0..1). */
  shadowStrength: number;
}

/**
 * Merged, renderable view of a token set. This is what the preview grid
 * consumes and what the CSS-variable bridge reads from.
 */
export interface TokenSet {
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
}

/** Half of a persisted category: the scraped baseline plus any overrides. */
export interface TokenLayer<T> {
  extracted: T;
  overrides: Partial<T>;
}

/**
 * What we actually store on `DesignTokenSet`. Each category is split into
 * (extracted, overrides) so the "locked" set can survive re-scraping:
 *
 *   - Unlocked token → overridden? use override : use extracted
 *   - Locked token   → always use override (or extracted frozen at lock time)
 */
export interface TokenSetRecord {
  colors: TokenLayer<ColorTokens>;
  typography: TokenLayer<TypographyTokens>;
  spacing: TokenLayer<SpacingTokens>;
  meta: TokenMeta;
  locked: string[];
}

export interface TokenMeta {
  /** Full extracted palette (up to 8 swatches), for the "raw data" drawer. */
  palette: string[];
  /** Where the primary color came from — image analysis or CSS. */
  accentSource: "image" | "css" | "fallback";
  /** Confidence score 0..1 for the extraction quality. */
  confidence: number;
  /** Summary of detected fonts before we picked the heading/body split. */
  detectedFonts: string[];
  /** Name of the fallback template used, if any. */
  fallbackTemplate?: string;
}

/** Dotted token paths — enumerated for compile-time safety in the lock UI. */
export type TokenPath =
  | `colors.${keyof ColorTokens}`
  | `typography.${keyof TypographyTokens}`
  | `spacing.${"unit" | "radius" | "shadowStrength"}`;
