import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for the dashboard. Structurally mirrors the real layout
 * so the page doesn't jump when it hydrates. The assessment specifically
 * asks for "elegant skeleton screens during scraping (not generic spinners)".
 */
export default function DashboardLoading() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <div className="flex items-center gap-4 border-b border-border px-6 py-3">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-64" />
        <div className="ml-auto flex items-center gap-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
      <div className="grid flex-1 grid-cols-[420px_1fr]">
        <div className="space-y-3 border-r border-border p-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
        <div className="p-10">
          <Skeleton className="h-4 w-24 rounded-full" />
          <Skeleton className="mt-4 h-12 w-3/4" />
          <Skeleton className="mt-2 h-12 w-2/3" />
          <div className="mt-8 flex gap-2">
            <Skeleton className="h-10 w-32 rounded-lg" />
            <Skeleton className="h-10 w-28 rounded-lg" />
          </div>
          <div className="mt-12 grid grid-cols-3 gap-4">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
