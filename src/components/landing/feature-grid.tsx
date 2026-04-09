import {
  Lock,
  Palette,
  Type,
  Ruler,
  History,
  Download,
} from "lucide-react";

const FEATURES = [
  {
    icon: Palette,
    title: "Color intelligence",
    body: "Dominant-color analysis across CSS, images, and component slots. Coherent palettes — not raw dumps.",
  },
  {
    icon: Type,
    title: "Typographic scale",
    body: "Detect heading/body fonts, infer base size, snap to a recognized modular scale (1.2, 1.25, 1.333…).",
  },
  {
    icon: Ruler,
    title: "Spacing rhythm",
    body: "Reverse-engineer base units (4px vs 8px) and build a clean scale from the page's real margins.",
  },
  {
    icon: Lock,
    title: "Lock what matters",
    body: "Pin any token to freeze it across re-scrapes. Everything else stays live.",
  },
  {
    icon: History,
    title: "Time-machine history",
    body: "Every edit is versioned. Jump back to any prior state with a single click.",
  },
  {
    icon: Download,
    title: "Export anywhere",
    body: "Ship as CSS custom properties, a flat JSON token file, or a Tailwind config block.",
  },
];

export function FeatureGrid() {
  return (
    <section className="mx-auto grid w-full max-w-5xl gap-4 md:grid-cols-2 lg:grid-cols-3">
      {FEATURES.map(({ icon: Icon, title, body }) => (
        <div
          key={title}
          className="group rounded-2xl border border-border bg-surface-raised p-6 transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-[0_24px_60px_-36px_hsl(var(--app-accent)/0.4)]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
            <Icon className="size-5" />
          </div>
          <h3 className="mt-4 text-[15px] font-semibold text-foreground">
            {title}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {body}
          </p>
        </div>
      ))}
    </section>
  );
}
