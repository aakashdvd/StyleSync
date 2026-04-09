"use client";

import { useEffect } from "react";
import { DashboardHeader } from "./dashboard-header";
import { ColorEditor } from "./color-editor";
import { TypographyEditor } from "./typography-editor";
import { SpacingEditor } from "./spacing-editor";
import { ExportPanel } from "./export-panel";
import { VersionHistory } from "./version-history";
import { PreviewCanvas } from "@/components/preview/preview-canvas";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTokenStore, type SiteSummary } from "@/store/tokens";
import { useTokenSync } from "@/hooks/use-token-sync";
import type { TokenSetRecord } from "@/lib/tokens/types";
import { FallbackBanner } from "./fallback-banner";

interface Props {
  siteId: string;
  site: SiteSummary;
  record: TokenSetRecord;
}

export function DashboardShell({ siteId, site, record }: Props) {
  const hydrate = useTokenStore((s) => s.hydrate);

  useEffect(() => {
    hydrate(siteId, site, record);
  }, [siteId, site, record, hydrate]);

  useTokenSync();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <DashboardHeader />
      {site.status === "FALLBACK" && (
        <FallbackBanner reason={site.statusReason} />
      )}
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[420px_1fr]">
        {/* Editor sidebar */}
        <aside className="thin-scroll flex min-h-0 flex-col overflow-y-auto border-b border-border bg-surface lg:border-b-0 lg:border-r">
          <Tabs defaultValue="colors" className="flex-1">
            <div className="sticky top-0 z-10 border-b border-border bg-surface/90 px-4 py-3 backdrop-blur">
              <TabsList className="w-full">
                <TabsTrigger value="colors" className="flex-1">
                  Colors
                </TabsTrigger>
                <TabsTrigger value="typography" className="flex-1">
                  Typography
                </TabsTrigger>
                <TabsTrigger value="spacing" className="flex-1">
                  Spacing
                </TabsTrigger>
                <TabsTrigger value="export" className="flex-1">
                  Export
                </TabsTrigger>
                <TabsTrigger value="history" className="flex-1">
                  History
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="px-4 py-4">
              <TabsContent value="colors">
                <ColorEditor />
              </TabsContent>
              <TabsContent value="typography">
                <TypographyEditor />
              </TabsContent>
              <TabsContent value="spacing">
                <SpacingEditor />
              </TabsContent>
              <TabsContent value="export">
                <ExportPanel />
              </TabsContent>
              <TabsContent value="history">
                <VersionHistory />
              </TabsContent>
            </div>
          </Tabs>
        </aside>

        {/* Preview canvas */}
        <main className="thin-scroll min-h-0 overflow-y-auto">
          <PreviewCanvas />
        </main>
      </div>
    </div>
  );
}
