"use client";

/*
 * Preview UI kit — the components rendered inside a `.preview-scope`.
 *
 * These components DO NOT share code with the dashboard chrome. They are
 * deliberately self-contained and use only CSS custom properties that live
 * inside the preview scope: --color-primary, --font-heading, --spacing-md,
 * --radius-md, etc. That way editing a token updates the preview by writing
 * CSS variables on the scope element — zero React re-renders in the
 * preview tree, which keeps the round-trip under a frame.
 */

import type { ReactNode } from "react";

/* ---------- Buttons ---------- */

export function PreviewButton({
  children,
  variant = "primary",
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const baseStyle = {
    fontFamily: "var(--font-body)",
    fontWeight: 600,
    borderRadius: "var(--radius-md)",
    padding: "calc(var(--spacing-sm)) calc(var(--spacing-lg))",
    transition: "transform 120ms ease, box-shadow 120ms ease",
    cursor: "pointer",
    border: "1px solid transparent",
    fontSize: "calc(var(--font-size-base) * 0.94)",
    lineHeight: 1,
  } as const;

  if (variant === "primary") {
    return (
      <button
        style={{
          ...baseStyle,
          background: "var(--color-primary)",
          color: "var(--color-primary-contrast)",
          boxShadow:
            "0 1px 0 0 rgba(255,255,255,0.2) inset, 0 8px 24px -12px color-mix(in srgb, var(--color-primary) 70%, transparent)",
        }}
      >
        {children}
      </button>
    );
  }
  if (variant === "secondary") {
    return (
      <button
        style={{
          ...baseStyle,
          background: "var(--color-muted)",
          color: "var(--color-foreground)",
          borderColor: "var(--color-border)",
        }}
      >
        {children}
      </button>
    );
  }
  return (
    <button
      style={{
        ...baseStyle,
        background: "transparent",
        color: "var(--color-foreground)",
      }}
    >
      {children}
    </button>
  );
}

/* ---------- Inputs ---------- */

export function PreviewInput({
  label,
  state = "default",
  placeholder,
}: {
  label: string;
  state?: "default" | "focus" | "error";
  placeholder?: string;
}) {
  const borderColor =
    state === "error"
      ? "var(--color-danger)"
      : state === "focus"
        ? "var(--color-primary)"
        : "var(--color-border)";
  const ring =
    state === "focus"
      ? "0 0 0 3px color-mix(in srgb, var(--color-primary) 25%, transparent)"
      : state === "error"
        ? "0 0 0 3px color-mix(in srgb, var(--color-danger) 20%, transparent)"
        : "none";
  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xs)" }}
    >
      <label
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "calc(var(--font-size-base) * 0.8)",
          color: "var(--color-foreground)",
          opacity: 0.78,
          fontWeight: 500,
        }}
      >
        {label}
      </label>
      <input
        defaultValue={state === "error" ? "not@valid" : undefined}
        placeholder={placeholder ?? "Type something…"}
        style={{
          height: "calc(var(--spacing-unit) * 10)",
          padding: "0 var(--spacing-md)",
          borderRadius: "var(--radius-md)",
          border: `1px solid ${borderColor}`,
          background: "var(--color-background)",
          color: "var(--color-foreground)",
          fontFamily: "var(--font-body)",
          fontSize: "calc(var(--font-size-base) * 0.92)",
          outline: "none",
          boxShadow: ring,
        }}
      />
      {state === "error" && (
        <span
          style={{
            color: "var(--color-danger)",
            fontSize: "calc(var(--font-size-base) * 0.78)",
            fontFamily: "var(--font-body)",
          }}
        >
          Please enter a valid email address.
        </span>
      )}
    </div>
  );
}

/* ---------- Cards ---------- */

export function PreviewCard({
  variant = "default",
}: {
  variant?: "default" | "elevated" | "outline";
}) {
  const shadow =
    variant === "elevated"
      ? `0 24px 48px -24px rgba(15,23,42,calc(var(--shadow-strength) * 2.5)), 0 2px 4px rgba(15,23,42,calc(var(--shadow-strength) * 0.6))`
      : variant === "outline"
        ? "none"
        : `0 2px 4px rgba(15,23,42,calc(var(--shadow-strength) * 1.2))`;
  return (
    <div
      style={{
        background: "var(--color-background)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: "var(--spacing-lg)",
        boxShadow: shadow,
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-sm)",
        fontFamily: "var(--font-body)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--spacing-sm)",
        }}
      >
        <div
          style={{
            height: "calc(var(--spacing-unit) * 10)",
            width: "calc(var(--spacing-unit) * 10)",
            borderRadius: "calc(var(--radius-md) * 0.6)",
            background:
              "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
          }}
        />
        <div>
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: "var(--heading-weight)",
              fontSize: "calc(var(--font-size-base) * 1.05)",
              color: "var(--color-foreground)",
              letterSpacing: "var(--heading-tracking)",
            }}
          >
            Design audit
          </div>
          <div
            style={{
              color: "var(--color-foreground)",
              opacity: 0.6,
              fontSize: "calc(var(--font-size-base) * 0.82)",
            }}
          >
            {variant} card preview
          </div>
        </div>
      </div>
      <p
        style={{
          color: "var(--color-foreground)",
          opacity: 0.78,
          fontSize: "calc(var(--font-size-base) * 0.9)",
          lineHeight: "var(--line-height)",
          margin: 0,
        }}
      >
        Cards consume the extracted tokens via CSS custom properties, so
        they re-skin instantly as you edit.
      </p>
      <div
        style={{
          display: "flex",
          gap: "var(--spacing-sm)",
          marginTop: "var(--spacing-xs)",
        }}
      >
        <PreviewButton variant="primary">View report</PreviewButton>
        <PreviewButton variant="ghost">Dismiss</PreviewButton>
      </div>
    </div>
  );
}

/* ---------- Typography specimens ---------- */

export function PreviewTypeScale() {
  const samples: { level: string; text: string; size: number }[] = [
    { level: "H1 · Display", text: "Design, automated.", size: 3.2 },
    { level: "H2 · Heading", text: "Tokens that travel with you.", size: 2.4 },
    { level: "H3 · Subhead", text: "Locked. Versioned. Shareable.", size: 1.8 },
    { level: "H4 · Eyebrow", text: "StyleSync token set", size: 1.4 },
    {
      level: "Body",
      text: "Small details matter. This paragraph inherits the body font, base size, and line height from the extracted tokens so you can judge readability in context.",
      size: 1,
    },
    { level: "Caption", text: "Updated just now", size: 0.82 },
  ];
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-lg)",
      }}
    >
      {samples.map((sample) => {
        const isBody = sample.level === "Body";
        const isCaption = sample.level === "Caption";
        return (
          <div key={sample.level}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: "var(--color-foreground)",
                opacity: 0.4,
                marginBottom: "var(--spacing-xs)",
              }}
            >
              {sample.level}
            </div>
            <div
              style={{
                fontFamily: isBody || isCaption ? "var(--font-body)" : "var(--font-heading)",
                fontSize: `calc(var(--font-size-base) * ${sample.size})`,
                fontWeight: isBody || isCaption ? "var(--body-weight)" : "var(--heading-weight)",
                letterSpacing:
                  isBody || isCaption ? "0" : "var(--heading-tracking)",
                lineHeight: isBody ? "var(--line-height)" : 1.1,
                color: "var(--color-foreground)",
                margin: 0,
                opacity: isCaption ? 0.6 : 1,
              }}
            >
              {sample.text}
            </div>
          </div>
        );
      })}
    </div>
  );
}
