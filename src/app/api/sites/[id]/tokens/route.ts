import { z } from "zod";
import { fail, ok } from "@/lib/api";
import { updateTokenPath } from "@/lib/repo/sites";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  path: z
    .string()
    .regex(/^(colors|typography|spacing)\.[A-Za-z][A-Za-z0-9]*$/),
  value: z.unknown(),
});

export async function PATCH(
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
    const site = await updateTokenPath(id, parsed.data.path, parsed.data.value);
    if (!site) return fail("Site not found", 404, "not_found");
    return ok(site);
  } catch (err) {
    console.error("[api/sites/:id/tokens] failed:", err);
    return fail("Unable to update token", 500, "update_failed");
  }
}
