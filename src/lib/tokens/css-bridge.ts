import type { TokenSet } from "./types";

/**
 * The CSS custom-property names exposed by every preview component. The
 * contract is: if you want to read a token in a component, read it here —
 * never read the JS object directly. That way the preview updates in under a
 * frame on any edit, because we're just writing to `style.setProperty()`.
 */
export const CSS_VAR_NAMES = {
  // Colors
  "--color-primary": "colors.primary",
  "--color-primary-contrast": "colors.primary.contrast",
  "--color-secondary": "colors.secondary",
  "--color-accent": "colors.accent",
  "--color-background": "colors.background",
  "--color-foreground": "colors.foreground",
  "--color-muted": "colors.muted",
  "--color-border": "colors.border",
  "--color-danger": "colors.danger",
  "--color-success": "colors.success",
  "--color-warning": "colors.warning",

  // Typography
  "--font-heading": "typography.headingFont",
  "--font-body": "typography.bodyFont",
  "--font-mono": "typography.monoFont",
  "--font-size-base": "typography.baseSize",
  "--font-scale": "typography.scaleRatio",
  "--line-height": "typography.lineHeight",
  "--heading-weight": "typography.headingWeight",
  "--body-weight": "typography.bodyWeight",
  "--heading-tracking": "typography.headingTracking",

  // Spacing
  "--spacing-unit": "spacing.unit",
  "--spacing-xs": "spacing.xs",
  "--spacing-sm": "spacing.sm",
  "--spacing-md": "spacing.md",
  "--spacing-lg": "spacing.lg",
  "--spacing-xl": "spacing.xl",
  "--spacing-2xl": "spacing.2xl",
  "--radius-md": "spacing.radius",
  "--shadow-strength": "spacing.shadowStrength",
} as const;

/**
 * Best-effort contrast color against a hex. Used so Primary buttons always
 * pick white or black text without the user having to think about it.
 */
export function pickContrast(hex: string): string {
  const normalized = hex.replace("#", "");
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  // Relative luminance per WCAG.
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.55 ? "#0f172a" : "#ffffff";
}

/**
 * Produce the CSS var map that represents a fully-resolved token set. This
 * feeds both the runtime "setProperty" path and the export-to-CSS path.
 */
export function tokenSetToCssVars(tokens: TokenSet): Record<string, string> {
  const { colors, typography, spacing } = tokens;
  const unit = spacing.unit;
  const scale = spacing.scale;
  const safe = (i: number, fallback: number) => scale[i] ?? fallback;

  return {
    "--color-primary": colors.primary,
    "--color-primary-contrast": pickContrast(colors.primary),
    "--color-secondary": colors.secondary,
    "--color-accent": colors.accent,
    "--color-background": colors.background,
    "--color-foreground": colors.foreground,
    "--color-muted": colors.muted,
    "--color-border": colors.border,
    "--color-danger": colors.danger,
    "--color-success": colors.success,
    "--color-warning": colors.warning,

    "--font-heading": typography.headingFont,
    "--font-body": typography.bodyFont,
    "--font-mono": typography.monoFont,
    "--font-size-base": `${typography.baseSize}px`,
    "--font-scale": `${typography.scaleRatio}`,
    "--line-height": `${typography.lineHeight}`,
    "--heading-weight": `${typography.headingWeight}`,
    "--body-weight": `${typography.bodyWeight}`,
    "--heading-tracking": `${typography.headingTracking}em`,

    "--spacing-unit": `${unit}px`,
    "--spacing-xs": `${unit * safe(1, 0.5)}px`,
    "--spacing-sm": `${unit * safe(2, 1)}px`,
    "--spacing-md": `${unit * safe(3, 2)}px`,
    "--spacing-lg": `${unit * safe(4, 3)}px`,
    "--spacing-xl": `${unit * safe(5, 4)}px`,
    "--spacing-2xl": `${unit * safe(6, 6)}px`,
    "--radius-md": `${spacing.radius}px`,
    "--shadow-strength": `${spacing.shadowStrength}`,
  };
}

/**
 * Apply a token set to a DOM element by writing CSS custom properties on its
 * style. O(n) in number of variables — very cheap. The preview grid wraps its
 * content in a div with `ref={applyTokensRef}` so edits propagate instantly.
 */
export function applyTokensToElement(el: HTMLElement, tokens: TokenSet) {
  const vars = tokenSetToCssVars(tokens);
  for (const [key, value] of Object.entries(vars)) {
    el.style.setProperty(key, value);
  }
}
