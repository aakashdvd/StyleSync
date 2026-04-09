import { z } from "zod";
import { fail, ok } from "@/lib/api";
import { setTokenLock } from "@/lib/repo/sites";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  path: z.string(),
  locked: z.boolean(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Request body must be JSON", 400, "invalid_json");
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return fail("Invalid payload", 400, "invalid_payload", parsed.error.format());
  }

  try {
    const site = await setTokenLock(id, parsed.data.path, parsed.data.locked);
    if (!site) return fail("Site not found", 404, "not_found");
    return ok(site);
  } catch (err) {
    console.error("[api/sites/:id/lock] failed:", err);
    return fail("Unable to update lock", 500, "lock_failed");
  }
}
