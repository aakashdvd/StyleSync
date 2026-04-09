/**
 * Seed script.
 *
 * Creates three pre-populated "extractions" so reviewers can explore the
 * dashboard end-to-end without needing to run a real scrape. Each one
 * corresponds to a distinct aesthetic (minimalist noir, electric indigo,
 * warm editorial) so the component preview has something interesting to
 * show from the moment the app boots.
 *
 * Usage: `pnpm db:seed` (or `npm run db:seed`).
 */

import { PrismaClient, type Prisma } from "@prisma/client";
import { FALLBACK_TEMPLATES } from "../src/lib/extractors/fallbacks";
import type { TokenSetRecord } from "../src/lib/tokens/types";

const prisma = new PrismaClient();

interface Seed {
  url: string;
  title: string;
  description: string;
  templateIndex: number;
}

const SEEDS: Seed[] = [
  {
    url: "https://example-minimal.test",
    title: "Atlas — A minimalist portfolio",
    description: "A noir-toned creative portfolio that lets the work breathe.",
    templateIndex: 0,
  },
  {
    url: "https://example-saas.test",
    title: "Flux — Developer velocity tools",
    description: "Electric indigo gradients, bright accents, modern SaaS.",
    templateIndex: 1,
  },
  {
    url: "https://example-editorial.test",
    title: "The Morning Edit — Weekly stories",
    description: "A warm, editorial magazine with long-form typography.",
    templateIndex: 2,
  },
];

async function main() {
  for (const seed of SEEDS) {
    const template = FALLBACK_TEMPLATES[seed.templateIndex];
    const normalized = seed.url.toLowerCase();
    const record: TokenSetRecord = {
      colors: { extracted: template.colors, overrides: {} },
      typography: { extracted: template.typography, overrides: {} },
      spacing: { extracted: template.spacing, overrides: {} },
      meta: {
        palette: template.palette,
        accentSource: "css",
        confidence: 0.82,
        detectedFonts: [
          template.typography.headingFont,
          template.typography.bodyFont,
        ],
      },
      locked: [],
    };

    const existing = await prisma.scrapedSite.findFirst({
      where: { normalizedUrl: normalized },
    });
    if (existing) {
      console.log(`· skipping existing ${seed.url}`);
      continue;
    }

    await prisma.scrapedSite.create({
      data: {
        url: seed.url,
        normalizedUrl: normalized,
        title: seed.title,
        description: seed.description,
        status: "SUCCESS",
        scrapedAt: new Date(),
        tokens: {
          create: {
            colors: record.colors as unknown as Prisma.InputJsonValue,
            typography: record.typography as unknown as Prisma.InputJsonValue,
            spacing: record.spacing as unknown as Prisma.InputJsonValue,
            meta: record.meta as unknown as Prisma.InputJsonValue,
            locked: [],
            currentVersion: 1,
          },
        },
        versions: {
          create: {
            version: 1,
            label: "Initial seed",
            changeType: "SCRAPE",
            changedPaths: [],
            snapshot: record as unknown as Prisma.InputJsonValue,
          },
        },
      },
    });
    console.log(`✓ seeded ${seed.url}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
