"use client";

import { useEffect, useRef } from "react";
import { useTokenStore } from "@/store/tokens";
import { applyTokensToElement } from "@/lib/tokens/css-bridge";
import {
  PreviewButton,
  PreviewCard,
  PreviewInput,
  PreviewTypeScale,
} from "./preview-kit";

/**
 * The live preview canvas.
 *
 * Key perf trick: we subscribe to the store imperatively and write CSS
 * variables on a ref. That way the preview DOM tree NEVER re-renders on
 * token edits — the new color just flows through CSS custom properties.
 * A colorful example: dragging the color picker updates the preview at
 * roughly 120fps because React isn't involved at all.
 */
export function PreviewCanvas() {
  const scopeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const applyCurrent = () => {
      const el = scopeRef.current;
      const resolved = useTokenStore.getState().resolved;
      if (!el || !resolved) return;
      applyTokensToElement(el, resolved);
    };
    applyCurrent();
    const unsubscribe = useTokenStore.subscribe(
      (s) => s.resolved,
      applyCurrent,
    );
    return () => unsubscribe();
  }, []);

  return (
    <div
      ref={scopeRef}
      className="preview-scope min-h-full w-full px-6 py-8 md:px-10 md:py-12"
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-12">
        {/* Hero / typography */}
        <section>
          <div className="text-[11px] uppercase tracking-[0.16em]" style={{ color: "var(--color-primary)" }}>
            Live preview
          </div>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "calc(var(--font-size-base) * 3.4)",
              fontWeight: "var(--heading-weight)",
              letterSpacing: "var(--heading-tracking)",
              lineHeight: 1.05,
              marginTop: "calc(var(--spacing-unit) * 2)",
              marginBottom: 0,
            }}
          >
            The tokens you see on the left power every component on this
            canvas in real time.
          </h1>
          <p
            style={{
              maxWidth: "640px",
              marginTop: "var(--spacing-md)",
              fontSize: "calc(var(--font-size-base) * 1)",
              lineHeight: "var(--line-height)",
              opacity: 0.78,
            }}
          >
            Edit a color, drag a spacing handle, swap the heading font — the
            change propagates through CSS custom properties with no React
            reconciliation in the preview subtree.
          </p>
          <div
            style={{
              display: "flex",
              gap: "var(--spacing-sm)",
              marginTop: "var(--spacing-lg)",
            }}
          >
            <PreviewButton variant="primary">Get started</PreviewButton>
            <PreviewButton variant="secondary">View docs</PreviewButton>
            <PreviewButton variant="ghost">Changelog</PreviewButton>
          </div>
        </section>

        {/* Button variants */}
        <section>
          <SectionLabel label="Buttons" />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "var(--spacing-md)",
            }}
          >
            <LabeledSlot label="Primary">
              <PreviewButton variant="primary">Primary action</PreviewButton>
            </LabeledSlot>
            <LabeledSlot label="Secondary">
              <PreviewButton variant="secondary">Secondary</PreviewButton>
            </LabeledSlot>
            <LabeledSlot label="Ghost">
              <PreviewButton variant="ghost">Ghost</PreviewButton>
            </LabeledSlot>
          </div>
        </section>

        {/* Inputs */}
        <section>
          <SectionLabel label="Inputs" />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "var(--spacing-md)",
            }}
          >
            <PreviewInput label="Default" placeholder="you@example.com" />
            <PreviewInput label="Focused" state="focus" placeholder="you@example.com" />
            <PreviewInput label="Error" state="error" placeholder="you@example.com" />
          </div>
        </section>

        {/* Cards */}
        <section>
          <SectionLabel label="Cards" />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "var(--spacing-md)",
            }}
          >
            <PreviewCard variant="default" />
            <PreviewCard variant="elevated" />
            <PreviewCard variant="outline" />
          </div>
        </section>

        {/* Type scale */}
        <section>
          <SectionLabel label="Type scale" />
          <PreviewTypeScale />
        </section>
      </div>
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div
      style={{
        fontSize: "11px",
        fontFamily: "var(--font-mono)",
        textTransform: "uppercase",
        letterSpacing: "0.16em",
        opacity: 0.5,
        marginBottom: "var(--spacing-md)",
      }}
    >
      {label}
    </div>
  );
}

function LabeledSlot({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-xs)",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          opacity: 0.5,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}
