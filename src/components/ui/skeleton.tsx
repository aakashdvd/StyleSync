import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Shimmer-backed skeleton. Intentionally NOT a spinner — the assessment
 * explicitly asks for "elegant skeleton screens during scraping (not generic
 * spinners)".
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton", className)} {...props} />;
}
