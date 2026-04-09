import { fail, ok } from "@/lib/api";
import { listVersions } from "@/lib/repo/sites";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const versions = await listVersions(id);
    return ok(versions);
  } catch (err) {
    console.error("[api/sites/:id/versions] failed:", err);
    return fail("Unable to load history", 500, "history_failed");
  }
}
