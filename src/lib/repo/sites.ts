import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { extractFromUrl } from "@/lib/extractors";
import { diffTokenPaths, mergeRescrape, setTokenValue } from "@/lib/tokens/merge";
import type { TokenSetRecord } from "@/lib/tokens/types";
import { normalizeUrl } from "@/lib/utils";

/**
 * Repository for ScrapedSite + DesignTokenSet.
 *
 * Keeping Prisma access behind a function boundary means the API route
 * handlers stay small and testable, and the UI never gets its hands on a
 * raw Prisma record (the token shape is cast through Zod at this layer).
 */

export async function findSiteById(id: string) {
  return prisma.scrapedSite.findUnique({
    where: { id },
    include: { tokens: true },
  });
}

export async function listRecentSites(limit = 12) {
  return prisma.scrapedSite.findMany({
    orderBy: { scrapedAt: "desc" },
    take: limit,
    include: { tokens: true },
  });
}

/**
 * Scrape a URL and persist the result.
 *
 * If this URL has been scraped before, we update the existing row and merge
 * any locked tokens forward. Otherwise we create a new row.
 */
export async function scrapeAndPersist(rawUrl: string) {
  const normalized = normalizeUrl(rawUrl);
  const existing = await prisma.scrapedSite.findFirst({
    where: { normalizedUrl: normalized },
    include: { tokens: true },
  });

  const result = await extractFromUrl(normalized);

  if (existing && existing.tokens) {
    // Merge fresh extraction into the persisted record, preserving locks.
    const previous = existing.tokens as unknown as {
      colors: TokenSetRecord["colors"];
      typography: TokenSetRecord["typography"];
      spacing: TokenSetRecord["spacing"];
      meta: TokenSetRecord["meta"];
      locked: string[];
    };

    const merged = mergeRescrape(
      {
        colors: previous.colors,
        typography: previous.typography,
        spacing: previous.spacing,
        meta: previous.meta,
        locked: previous.locked,
      },
      {
        colors: result.record.colors.extracted,
        typography: result.record.typography.extracted,
        spacing: result.record.spacing.extracted,
        meta: result.record.meta,
      },
    );

    const nextVersion = existing.tokens.currentVersion + 1;
    const changedPaths = diffTokenPaths(
      {
        colors: previous.colors,
        typography: previous.typography,
        spacing: previous.spacing,
        meta: previous.meta,
        locked: previous.locked,
      },
      merged,
    );

    const [site] = await prisma.$transaction([
      prisma.scrapedSite.update({
        where: { id: existing.id },
        data: {
          title: result.title ?? existing.title,
          description: result.description ?? existing.description,
          faviconUrl: result.faviconUrl ?? existing.faviconUrl,
          status: result.status,
          statusReason: result.statusReason,
          htmlSnapshot: result.htmlSnapshot ?? existing.htmlSnapshot,
          scrapedAt: new Date(),
          tokens: {
            update: {
              colors: merged.colors as unknown as Prisma.InputJsonValue,
              typography: merged.typography as unknown as Prisma.InputJsonValue,
              spacing: merged.spacing as unknown as Prisma.InputJsonValue,
              meta: merged.meta as unknown as Prisma.InputJsonValue,
              locked: merged.locked,
              currentVersion: nextVersion,
            },
          },
          versions: {
            create: {
              version: nextVersion,
              label: "Re-scrape",
              changeType: "SCRAPE",
              changedPaths,
              snapshot: merged as unknown as Prisma.InputJsonValue,
            },
          },
        },
        include: { tokens: true },
      }),
    ]);

    return site;
  }

  // Fresh insert.
  return prisma.scrapedSite.create({
    data: {
      url: rawUrl,
      normalizedUrl: normalized,
      title: result.title,
      description: result.description,
      faviconUrl: result.faviconUrl,
      htmlSnapshot: result.htmlSnapshot,
      status: result.status,
      statusReason: result.statusReason,
      tokens: {
        create: {
          colors: result.record.colors as unknown as Prisma.InputJsonValue,
          typography: result.record.typography as unknown as Prisma.InputJsonValue,
          spacing: result.record.spacing as unknown as Prisma.InputJsonValue,
          meta: result.record.meta as unknown as Prisma.InputJsonValue,
          locked: [],
          currentVersion: 1,
        },
      },
      versions: {
        create: {
          version: 1,
          label: "Initial scrape",
          changeType: "SCRAPE",
          changedPaths: [],
          snapshot: result.record as unknown as Prisma.InputJsonValue,
        },
      },
    },
    include: { tokens: true },
  });
}

/** Update a single token path. Writes a new VersionHistory row. */
export async function updateTokenPath(
  siteId: string,
  path: string,
  value: unknown,
) {
  const site = await prisma.scrapedSite.findUnique({
    where: { id: siteId },
    include: { tokens: true },
  });
  if (!site?.tokens) return null;

  const current: TokenSetRecord = {
    colors: site.tokens.colors as unknown as TokenSetRecord["colors"],
    typography: site.tokens.typography as unknown as TokenSetRecord["typography"],
    spacing: site.tokens.spacing as unknown as TokenSetRecord["spacing"],
    meta: site.tokens.meta as unknown as TokenSetRecord["meta"],
    locked: site.tokens.locked,
  };

  const next = setTokenValue(current, path, value);
  if (next === current) return site; // locked path — no-op

  const nextVersion = site.tokens.currentVersion + 1;

  await prisma.$transaction([
    prisma.designTokenSet.update({
      where: { id: site.tokens.id },
      data: {
        colors: next.colors as unknown as Prisma.InputJsonValue,
        typography: next.typography as unknown as Prisma.InputJsonValue,
        spacing: next.spacing as unknown as Prisma.InputJsonValue,
        currentVersion: nextVersion,
      },
    }),
    prisma.versionHistory.create({
      data: {
        siteId: site.id,
        version: nextVersion,
        label: `Edit ${path}`,
        changeType: "EDIT",
        changedPaths: [path],
        snapshot: next as unknown as Prisma.InputJsonValue,
      },
    }),
  ]);

  return findSiteById(siteId);
}

/** Lock or unlock a token path. */
export async function setTokenLock(
  siteId: string,
  path: string,
  locked: boolean,
) {
  const site = await prisma.scrapedSite.findUnique({
    where: { id: siteId },
    include: { tokens: true },
  });
  if (!site?.tokens) return null;

  const set = new Set(site.tokens.locked);
  if (locked) set.add(path);
  else set.delete(path);
  const nextLocked = [...set];

  const nextVersion = site.tokens.currentVersion + 1;
  const snapshot: TokenSetRecord = {
    colors: site.tokens.colors as unknown as TokenSetRecord["colors"],
    typography: site.tokens.typography as unknown as TokenSetRecord["typography"],
    spacing: site.tokens.spacing as unknown as TokenSetRecord["spacing"],
    meta: site.tokens.meta as unknown as TokenSetRecord["meta"],
    locked: nextLocked,
  };

  await prisma.$transaction([
    prisma.designTokenSet.update({
      where: { id: site.tokens.id },
      data: {
        locked: nextLocked,
        currentVersion: nextVersion,
      },
    }),
    prisma.versionHistory.create({
      data: {
        siteId: site.id,
        version: nextVersion,
        label: `${locked ? "Lock" : "Unlock"} ${path}`,
        changeType: locked ? "LOCK" : "UNLOCK",
        changedPaths: [path],
        snapshot: snapshot as unknown as Prisma.InputJsonValue,
      },
    }),
  ]);

  return findSiteById(siteId);
}

export async function listVersions(siteId: string) {
  return prisma.versionHistory.findMany({
    where: { siteId },
    orderBy: { version: "desc" },
    take: 40,
  });
}

/** Revert a site to a specific version — writes a new REVERT row. */
export async function revertToVersion(siteId: string, version: number) {
  const site = await prisma.scrapedSite.findUnique({
    where: { id: siteId },
    include: { tokens: true },
  });
  if (!site?.tokens) return null;

  const target = await prisma.versionHistory.findUnique({
    where: { siteId_version: { siteId, version } },
  });
  if (!target) return null;

  const snapshot = target.snapshot as unknown as TokenSetRecord;
  const nextVersion = site.tokens.currentVersion + 1;

  await prisma.$transaction([
    prisma.designTokenSet.update({
      where: { id: site.tokens.id },
      data: {
        colors: snapshot.colors as unknown as Prisma.InputJsonValue,
        typography: snapshot.typography as unknown as Prisma.InputJsonValue,
        spacing: snapshot.spacing as unknown as Prisma.InputJsonValue,
        locked: snapshot.locked,
        currentVersion: nextVersion,
      },
    }),
    prisma.versionHistory.create({
      data: {
        siteId,
        version: nextVersion,
        label: `Revert to v${version}`,
        changeType: "REVERT",
        changedPaths: [],
        snapshot: snapshot as unknown as Prisma.InputJsonValue,
      },
    }),
  ]);

  return findSiteById(siteId);
}
