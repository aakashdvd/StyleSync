import { NextResponse } from "next/server";

/**
 * Minimal response helpers so every route returns a predictable envelope.
 * UI code in `src/hooks/*` assumes `{ data, error }` shape.
 */
export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data, error: null }, init);
}

export function fail(
  message: string,
  status = 400,
  code?: string,
  details?: unknown,
) {
  return NextResponse.json(
    {
      data: null,
      error: { message, code: code ?? "bad_request", details },
    },
    { status },
  );
}
