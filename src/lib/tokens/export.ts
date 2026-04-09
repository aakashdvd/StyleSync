import { tokenSetToCssVars } from "./css-bridge";
import type { TokenSet } from "./types";

/**
 * Export a TokenSet in three formats:
 *   1. CSS custom properties (`:root { --color-primary: …; }`)
 *   2. Flat JSON tokens (ready for Style Dictionary / design-tokens/*)
 *   3. Tailwind config block (keys that plug into theme.extend)
 *
 * Each function is a pure transform — no IO. The dashboard wraps them with
 * a "copy to clipboard" button.
 */

export function toCssVariables(tokens: TokenSet): string {
  const vars = tokenSetToCssVars(tokens);
  const lines = [":root {"];
  for (const [key, value] of Object.entries(vars)) {
    lines.push(`  ${key}: ${value};`);
  }
  lines.push("}");
  return lines.join("\n");
}

export function toJsonTokens(tokens: TokenSet): string {
  const out = {
    color: Object.fromEntries(
      Object.entries(tokens.colors).map(([k, v]) => [
        k,
        { value: v, type: "color" },
      ]),
    ),
    font: {
      heading: { value: tokens.typography.headingFont, type: "fontFamily" },
      body: { value: tokens.typography.bodyFont, type: "fontFamily" },
      mono: { value: tokens.typography.monoFont, type: "fontFamily" },
    },
    size: {
      base: { value: `${tokens.typography.baseSize}px`, type: "dimension" },
      scale: { value: `${tokens.typography.scaleRatio}`, type: "number" },
      lineHeight: {
        value: `${tokens.typography.lineHeight}`,
        type: "number",
      },
    },
    weight: {
      heading: {
        value: `${tokens.typography.headingWeight}`,
        type: "fontWeight",
      },
      body: { value: `${tokens.typography.bodyWeight}`, type: "fontWeight" },
    },
    spacing: {
      unit: { value: `${tokens.spacing.unit}px`, type: "dimension" },
      scale: {
        value: tokens.spacing.scale
          .map((m) => `${m * tokens.spacing.unit}px`)
          .join(" "),
        type: "dimension",
      },
      radius: { value: `${tokens.spacing.radius}px`, type: "dimension" },
    },
  };
  return JSON.stringify(out, null, 2);
}

export function toTailwindConfig(tokens: TokenSet): string {
  const scale = tokens.spacing.scale
    .map((m) => `    ${m}: "${m * tokens.spacing.unit}px",`)
    .join("\n");
  return `// tailwind.config.js — extend block
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: "${tokens.colors.primary}",
        secondary: "${tokens.colors.secondary}",
        accent: "${tokens.colors.accent}",
        background: "${tokens.colors.background}",
        foreground: "${tokens.colors.foreground}",
        muted: "${tokens.colors.muted}",
        border: "${tokens.colors.border}",
        danger: "${tokens.colors.danger}",
        success: "${tokens.colors.success}",
        warning: "${tokens.colors.warning}",
      },
      fontFamily: {
        heading: [${JSON.stringify(tokens.typography.headingFont)}],
        sans: [${JSON.stringify(tokens.typography.bodyFont)}],
        mono: [${JSON.stringify(tokens.typography.monoFont)}],
      },
      fontSize: {
        base: "${tokens.typography.baseSize}px",
      },
      borderRadius: {
        md: "${tokens.spacing.radius}px",
      },
      spacing: {
${scale}
      },
    },
  },
};`;
}
