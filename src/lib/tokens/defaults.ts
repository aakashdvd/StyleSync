import type {
  ColorTokens,
  SpacingTokens,
  TokenSet,
  TokenSetRecord,
  TypographyTokens,
} from "./types";

/**
 * Neutral fallback tokens. Used:
 *   1. As the seed `extracted` values for the {@link FALLBACK} template when
 *      scraping is fully blocked.
 *   2. As a safety net when a particular token key is missing from an
 *      otherwise-successful extraction.
 *
 * Chosen to feel like a generic "professional SaaS" theme — deliberately
 * unoffensive so the preview grid never looks broken.
 */
export const DEFAULT_COLORS: ColorTokens = {
  primary: "#4f46e5",
  secondary: "#7c3aed",
  accent: "#06b6d4",
  background: "#ffffff",
  foreground: "#0f172a",
  muted: "#f1f5f9",
  border: "#e2e8f0",
  danger: "#ef4444",
  success: "#10b981",
  warning: "#f59e0b",
};

export const DEFAULT_TYPOGRAPHY: TypographyTokens = {
  headingFont: "Inter, system-ui, sans-serif",
  bodyFont: "Inter, system-ui, sans-serif",
  monoFont: "ui-monospace, SFMono-Regular, monospace",
  baseSize: 16,
  scaleRatio: 1.25,
  lineHeight: 1.6,
  headingWeight: 700,
  bodyWeight: 400,
  headingTracking: -0.02,
};

export const DEFAULT_SPACING: SpacingTokens = {
  unit: 4,
  scale: [0, 0.5, 1, 2, 3, 4, 6, 8, 12, 16],
  radius: 10,
  shadowStrength: 0.08,
};

export const DEFAULT_TOKEN_SET: TokenSet = {
  colors: DEFAULT_COLORS,
  typography: DEFAULT_TYPOGRAPHY,
  spacing: DEFAULT_SPACING,
};

export const DEFAULT_TOKEN_RECORD: TokenSetRecord = {
  colors: { extracted: DEFAULT_COLORS, overrides: {} },
  typography: { extracted: DEFAULT_TYPOGRAPHY, overrides: {} },
  spacing: { extracted: DEFAULT_SPACING, overrides: {} },
  meta: {
    palette: Object.values(DEFAULT_COLORS).slice(0, 6),
    accentSource: "fallback",
    confidence: 0,
    detectedFonts: [DEFAULT_TYPOGRAPHY.headingFont, DEFAULT_TYPOGRAPHY.bodyFont],
  },
  locked: [],
};
