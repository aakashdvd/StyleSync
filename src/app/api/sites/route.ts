import { fail, ok } from "@/lib/api";
import { listRecentSites } from "@/lib/repo/sites";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sites = await listRecentSites(12);
    return ok(sites);
  } catch (err) {
    console.error("[api/sites] failed:", err);
    return fail("Unable to load sites", 500, "list_failed");
  }
}
