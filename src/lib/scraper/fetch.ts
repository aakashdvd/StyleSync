/**
 * Robust server-side fetch for scraping.
 *
 * The defaults are tuned to look as much like a normal browser as possible
 * without being dishonest — a real User-Agent that identifies StyleSyncBot,
 * realistic Accept headers, reasonable timeout, and a size cap so we never
 * blow up on a single bloated response.
 */

const DEFAULT_TIMEOUT_MS = Number(process.env.SCRAPE_TIMEOUT_MS ?? 12_000);
const DEFAULT_MAX_BYTES = Number(process.env.SCRAPE_MAX_BYTES ?? 3_000_000);
const DEFAULT_USER_AGENT =
  process.env.SCRAPE_USER_AGENT ??
  "Mozilla/5.0 (compatible; StyleSyncBot/1.0; +https://stylesync.app/bot)";

export interface FetchOptions {
  timeoutMs?: number;
  maxBytes?: number;
  accept?: string;
  referer?: string;
  headers?: Record<string, string>;
}

export interface FetchResult {
  url: string;
  status: number;
  headers: Headers;
  body: Uint8Array;
  text(): string;
}

export class ScrapeError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "timeout"
      | "too_large"
      | "network"
      | "http_error"
      | "blocked"
      | "invalid_url"
      | "unsupported_content",
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ScrapeError";
  }
}

/**
 * `safeFetch` — server-side fetch with a hard timeout, size cap, and
 * user-agent. Throws a {@link ScrapeError} on any failure, which the
 * orchestrator catches and converts into a friendly fallback state.
 */
export async function safeFetch(
  input: string,
  opts: FetchOptions = {},
): Promise<FetchResult> {
  let url: URL;
  try {
    url = new URL(input);
  } catch (cause) {
    throw new ScrapeError("Invalid URL", "invalid_url", cause);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ScrapeError("Only http/https URLs are supported", "invalid_url");
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    opts.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": DEFAULT_USER_AGENT,
        Accept:
          opts.accept ??
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        ...(opts.referer ? { Referer: opts.referer } : {}),
        ...opts.headers,
      },
    });
  } catch (cause) {
    clearTimeout(timeout);
    if ((cause as any)?.name === "AbortError") {
      throw new ScrapeError("Request timed out", "timeout", cause);
    }
    throw new ScrapeError("Network error", "network", cause);
  }
  clearTimeout(timeout);

  // 4xx/5xx → keep the response body for diagnostic messages but mark the
  // call as a failure upstream.
  if (response.status >= 400) {
    const code = response.status === 403 ? "blocked" : "http_error";
    throw new ScrapeError(
      `HTTP ${response.status} ${response.statusText}`,
      code,
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  const maxBytes = opts.maxBytes ?? DEFAULT_MAX_BYTES;

  // Stream read with a size cap so a hostile server can't make us OOM.
  const reader = response.body?.getReader();
  if (!reader) {
    throw new ScrapeError("Empty response body", "network");
  }

  const chunks: Uint8Array[] = [];
  let received = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    received += value.byteLength;
    if (received > maxBytes) {
      reader.cancel().catch(() => {});
      throw new ScrapeError(
        `Response exceeded ${maxBytes} bytes`,
        "too_large",
      );
    }
    chunks.push(value);
  }

  const body = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  const decoder = new TextDecoder(
    // Detect charset in Content-Type; default to utf-8.
    /charset=([^;]+)/i.exec(contentType)?.[1] ?? "utf-8",
    { fatal: false },
  );

  return {
    url: response.url,
    status: response.status,
    headers: response.headers,
    body,
    text: () => decoder.decode(body),
  };
}
