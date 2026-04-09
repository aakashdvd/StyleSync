-- CreateEnum
CREATE TYPE "ExtractionStatus" AS ENUM ('PENDING', 'SUCCESS', 'PARTIAL', 'FALLBACK', 'FAILED');

-- CreateEnum
CREATE TYPE "ChangeType" AS ENUM ('SCRAPE', 'EDIT', 'LOCK', 'UNLOCK', 'RESET', 'REVERT');

-- CreateTable
CREATE TABLE "ScrapedSite" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "normalizedUrl" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "faviconUrl" TEXT,
    "screenshotUrl" TEXT,
    "htmlSnapshot" TEXT,
    "status" "ExtractionStatus" NOT NULL DEFAULT 'PENDING',
    "statusReason" TEXT,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScrapedSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesignTokenSet" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "colors" JSONB NOT NULL,
    "typography" JSONB NOT NULL,
    "spacing" JSONB NOT NULL,
    "meta" JSONB NOT NULL,
    "locked" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesignTokenSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VersionHistory" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "label" TEXT,
    "changeType" "ChangeType" NOT NULL DEFAULT 'EDIT',
    "changedPaths" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VersionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScrapedSite_normalizedUrl_idx" ON "ScrapedSite"("normalizedUrl");

-- CreateIndex
CREATE INDEX "ScrapedSite_scrapedAt_idx" ON "ScrapedSite"("scrapedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DesignTokenSet_siteId_key" ON "DesignTokenSet"("siteId");

-- CreateIndex
CREATE INDEX "DesignTokenSet_siteId_idx" ON "DesignTokenSet"("siteId");

-- CreateIndex
CREATE INDEX "VersionHistory_siteId_createdAt_idx" ON "VersionHistory"("siteId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "VersionHistory_siteId_version_key" ON "VersionHistory"("siteId", "version");

-- GIN indexes on JSONB for fast token-field queries
CREATE INDEX "DesignTokenSet_colors_gin_idx" ON "DesignTokenSet" USING GIN ("colors");
CREATE INDEX "DesignTokenSet_typography_gin_idx" ON "DesignTokenSet" USING GIN ("typography");

-- AddForeignKey
ALTER TABLE "DesignTokenSet" ADD CONSTRAINT "DesignTokenSet_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "ScrapedSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VersionHistory" ADD CONSTRAINT "VersionHistory_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "ScrapedSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
