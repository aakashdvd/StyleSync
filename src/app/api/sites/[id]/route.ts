import { fail, ok } from "@/lib/api";
import { findSiteById } from "@/lib/repo/sites";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const site = await findSiteById(id);
    if (!site) return fail("Site not found", 404, "not_found");
    return ok(site);
  } catch (err) {
    console.error("[api/sites/:id] failed:", err);
    return fail("Unable to load site", 500, "read_failed");
  }
}
