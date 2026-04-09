import { z } from "zod";
import { fail, ok } from "@/lib/api";
import { scrapeAndPersist } from "@/lib/repo/sites";
import { normalizeUrl } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  url: z.string().min(3).max(2048),
});

export async function POST(req: Request) {
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

  let normalized: string;
  try {
    normalized = normalizeUrl(parsed.data.url);
  } catch {
    return fail("Enter a valid URL like https://example.com", 400, "invalid_url");
  }

  try {
    const site = await scrapeAndPersist(normalized);
    return ok(site);
  } catch (err) {
    console.error("[api/scrape] failed:", err);
    return fail("Unable to scrape right now", 500, "scrape_failed");
  }
}
