import Link from "next/link";
import { ArrowUpRight, Github } from "lucide-react";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { HeroMark } from "@/components/landing/hero-mark";
import { RecentSites } from "@/components/landing/recent-sites";
import { SiteMark } from "@/components/landing/site-mark";
import { UrlForm } from "@/components/landing/url-form";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Grid background that fades toward the center */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 grid-bg opacity-[0.35] [mask-image:radial-gradient(circle_at_50%_38%,_black,_transparent_70%)]"
      />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <SiteMark />
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            href="#features"
            className="hidden rounded-lg px-3 py-1.5 transition-colors hover:text-foreground md:inline-flex"
          >
            Features
          </Link>
          <Link
            href="https://github.com"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-raised px-3 py-1.5 text-foreground transition-colors hover:border-accent/50"
          >
            <Github className="size-4" />
            GitHub
            <ArrowUpRight className="size-3.5 text-muted-foreground" />
          </Link>
        </nav>
      </header>

      <main className="relative z-10">
        {/* Hero */}
        <section className="relative mx-auto flex min-h-[560px] w-full max-w-6xl flex-col items-center justify-center px-6 pb-16 pt-10 md:pt-20">
          <HeroMark />

          <div className="relative z-10 flex w-full flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-raised/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground backdrop-blur-sm">
              <span className="size-1.5 rounded-full bg-success animate-pulse" />
              Live tokens · real components · exportable
            </div>
            <h1 className="mt-6 max-w-3xl text-balance text-[44px] font-semibold leading-[1.04] tracking-[-0.02em] text-foreground md:text-[64px]">
              Turn any website into a living{" "}
              <span className="bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-cyan-500 bg-clip-text text-transparent">
                design system
              </span>
              .
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-[15px] leading-relaxed text-muted-foreground md:text-base">
              Paste a URL. StyleSync scrapes the page, extracts the colors,
              typography, and spacing — then drops you into a Figma-grade token
              editor with a live component preview.
            </p>

            <div className="mt-8 flex w-full flex-col items-center">
              <UrlForm />
            </div>
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="relative mx-auto w-full max-w-6xl px-6 py-24"
        >
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs uppercase tracking-[0.16em] text-accent">
              Everything you need
            </div>
            <h2 className="mt-3 text-[32px] font-semibold leading-tight tracking-tight text-foreground md:text-[40px]">
              Not a raw data dump. A design system you can ship.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              StyleSync prioritizes coherence over raw extraction. The
              generated tokens always produce a preview that feels intentional
              — minimalist sites stay minimalist, bold sites stay bold.
            </p>
          </div>
          <div className="mt-12">
            <FeatureGrid />
          </div>
        </section>

        <RecentSites />

        <footer className="mx-auto w-full max-w-6xl px-6 pb-12 pt-6 text-xs text-muted-foreground">
          <div className="flex flex-col items-start justify-between gap-2 border-t border-border pt-6 md:flex-row md:items-center">
            <div className="flex items-center gap-2">
              <SiteMark subtle />
              <span>· Built for the Purple Merit full-stack assessment</span>
            </div>
            <div>Open source · Next.js · Postgres · Prisma</div>
          </div>
        </footer>
      </main>
    </div>
  );
}
