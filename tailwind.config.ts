import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  darkMode: "class",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1440px" },
    },
    extend: {
      colors: {
        // App brand (dashboard chrome) — deliberately neutral so it never
        // competes with the extracted/previewed brand tokens.
        background: "hsl(var(--app-bg) / <alpha-value>)",
        surface: "hsl(var(--app-surface) / <alpha-value>)",
        "surface-raised": "hsl(var(--app-surface-raised) / <alpha-value>)",
        foreground: "hsl(var(--app-foreground) / <alpha-value>)",
        muted: "hsl(var(--app-muted) / <alpha-value>)",
        "muted-foreground": "hsl(var(--app-muted-foreground) / <alpha-value>)",
        border: "hsl(var(--app-border) / <alpha-value>)",
        ring: "hsl(var(--app-ring) / <alpha-value>)",
        accent: "hsl(var(--app-accent) / <alpha-value>)",
        "accent-foreground": "hsl(var(--app-accent-foreground) / <alpha-value>)",
        danger: "hsl(var(--app-danger) / <alpha-value>)",
        success: "hsl(var(--app-success) / <alpha-value>)",
        warning: "hsl(var(--app-warning) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-app-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-app-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl: "calc(var(--app-radius) + 4px)",
        lg: "var(--app-radius)",
        md: "calc(var(--app-radius) - 4px)",
        sm: "calc(var(--app-radius) - 8px)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 hsl(var(--app-accent) / 0.7)" },
          "70%": { boxShadow: "0 0 0 12px hsl(var(--app-accent) / 0)" },
          "100%": { boxShadow: "0 0 0 0 hsl(var(--app-accent) / 0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "dom-scan": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "pulse-ring": "pulse-ring 1.4s cubic-bezier(0.4,0,0.6,1) infinite",
        shimmer: "shimmer 2s linear infinite",
        "dom-scan": "dom-scan 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
