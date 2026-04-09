import type {
  ColorTokens,
  SpacingTokens,
  TokenSetRecord,
  TypographyTokens,
} from "@/lib/tokens/types";

/**
 * Curated fallback templates used when scraping fails entirely.
 *
 * These exist so the product doesn't show a dead end after a CORS failure —
 * the user gets a reasonable-looking starting point they can edit. Each
 * template is deliberately distinct so the user can tell at a glance that
 * they're looking at a fallback, not a real extraction.
 *
 * The template chosen is a deterministic hash of the URL so re-scraping a
 * blocked site produces the same fallback every time.
 */

export interface FallbackTemplate {
  name: string;
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  palette: string[];
}

export const FALLBACK_TEMPLATES: FallbackTemplate[] = [
  {
    name: "Minimalist Noir",
    colors: {
      primary: "#111111",
      secondary: "#3f3f46",
      accent: "#fbbf24",
      background: "#ffffff",
      foreground: "#0f172a",
      muted: "#f4f4f5",
      border: "#e4e4e7",
      danger: "#dc2626",
      success: "#10b981",
      warning: "#f59e0b",
    },
    typography: {
      headingFont: "'Fraunces', 'Times New Roman', serif",
      bodyFont: "'Inter', system-ui, sans-serif",
      monoFont: "ui-monospace, monospace",
      baseSize: 16,
      scaleRatio: 1.333,
      lineHeight: 1.65,
      headingWeight: 600,
      bodyWeight: 400,
      headingTracking: -0.015,
    },
    spacing: {
      unit: 4,
      scale: [0, 0.5, 1, 2, 3, 4, 6, 8, 12, 16],
      radius: 4,
      shadowStrength: 0.05,
    },
    palette: ["#111111", "#3f3f46", "#fbbf24", "#ffffff", "#f4f4f5", "#e4e4e7"],
  },
  {
    name: "Electric Indigo",
    colors: {
      primary: "#4f46e5",
      secondary: "#8b5cf6",
      accent: "#ec4899",
      background: "#fafafa",
      foreground: "#18181b",
      muted: "#f4f4f5",
      border: "#e4e4e7",
      danger: "#ef4444",
      success: "#22c55e",
      warning: "#eab308",
    },
    typography: {
      headingFont: "'Inter', system-ui, sans-serif",
      bodyFont: "'Inter', system-ui, sans-serif",
      monoFont: "'JetBrains Mono', monospace",
      baseSize: 16,
      scaleRatio: 1.25,
      lineHeight: 1.6,
      headingWeight: 700,
      bodyWeight: 400,
      headingTracking: -0.02,
    },
    spacing: {
      unit: 4,
      scale: [0, 0.5, 1, 2, 3, 4, 6, 8, 12],
      radius: 12,
      shadowStrength: 0.08,
    },
    palette: ["#4f46e5", "#8b5cf6", "#ec4899", "#fafafa", "#f4f4f5", "#18181b"],
  },
  {
    name: "Warm Editorial",
    colors: {
      primary: "#b45309",
      secondary: "#c2410c",
      accent: "#0f766e",
      background: "#fef7ed",
      foreground: "#1c1917",
      muted: "#fde68a",
      border: "#fcd34d",
      danger: "#b91c1c",
      success: "#15803d",
      warning: "#d97706",
    },
    typography: {
      headingFont: "'Playfair Display', 'Georgia', serif",
      bodyFont: "'Source Sans 3', system-ui, sans-serif",
      monoFont: "'IBM Plex Mono', monospace",
      baseSize: 17,
      scaleRatio: 1.414,
      lineHeight: 1.7,
      headingWeight: 700,
      bodyWeight: 400,
      headingTracking: -0.01,
    },
    spacing: {
      unit: 8,
      scale: [0, 0.5, 1, 1.5, 2, 3, 4, 6, 8],
      radius: 2,
      shadowStrength: 0.06,
    },
    palette: ["#b45309", "#c2410c", "#0f766e", "#fef7ed", "#fde68a", "#1c1917"],
  },
  {
    name: "Neo Brutalist",
    colors: {
      primary: "#22d3ee",
      secondary: "#fde047",
      accent: "#f472b6",
      background: "#0a0a0a",
      foreground: "#fafafa",
      muted: "#171717",
      border: "#262626",
      danger: "#f87171",
      success: "#4ade80",
      warning: "#facc15",
    },
    typography: {
      headingFont: "'Space Grotesk', 'Inter', sans-serif",
      bodyFont: "'Space Grotesk', 'Inter', sans-serif",
      monoFont: "'Space Mono', monospace",
      baseSize: 16,
      scaleRatio: 1.5,
      lineHeight: 1.55,
      headingWeight: 700,
      bodyWeight: 400,
      headingTracking: -0.03,
    },
    spacing: {
      unit: 4,
      scale: [0, 0.5, 1, 2, 3, 4, 6, 8, 12, 16],
      radius: 0,
      shadowStrength: 0.2,
    },
    palette: ["#22d3ee", "#fde047", "#f472b6", "#0a0a0a", "#171717", "#fafafa"],
  },
];

/** Deterministically select a fallback template by URL. */
export function selectFallback(url: string): FallbackTemplate {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = ((hash << 5) - hash + url.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % FALLBACK_TEMPLATES.length;
  return FALLBACK_TEMPLATES[index];
}

/** Build a TokenSetRecord from a fallback template. */
export function fallbackRecord(
  url: string,
  reason: string,
): { record: TokenSetRecord; template: FallbackTemplate } {
  const template = selectFallback(url);
  const record: TokenSetRecord = {
    colors: { extracted: template.colors, overrides: {} },
    typography: { extracted: template.typography, overrides: {} },
    spacing: { extracted: template.spacing, overrides: {} },
    meta: {
      palette: template.palette,
      accentSource: "fallback",
      confidence: 0.0,
      detectedFonts: [template.typography.headingFont, template.typography.bodyFont],
      fallbackTemplate: `${template.name} (${reason})`,
    },
    locked: [],
  };
  return { record, template };
}
