import { notFound } from "next/navigation";
import { findSiteById } from "@/lib/repo/sites";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import type { TokenSetRecord } from "@/lib/tokens/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const site = await findSiteById(id);
  if (!site || !site.tokens) notFound();

  const record: TokenSetRecord = {
    colors: site.tokens.colors as unknown as TokenSetRecord["colors"],
    typography: site.tokens.typography as unknown as TokenSetRecord["typography"],
    spacing: site.tokens.spacing as unknown as TokenSetRecord["spacing"],
    meta: site.tokens.meta as unknown as TokenSetRecord["meta"],
    locked: site.tokens.locked,
  };

  return (
    <DashboardShell
      siteId={site.id}
      site={{
        id: site.id,
        url: site.url,
        title: site.title,
        description: site.description,
        faviconUrl: site.faviconUrl,
        status: site.status,
        statusReason: site.statusReason,
        scrapedAt: site.scrapedAt.toISOString(),
      }}
      record={record}
    />
  );
}
