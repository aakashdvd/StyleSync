import Link from "next/link";

/** Wordmark used in the header of every page. */
export function SiteMark({ subtle = false }: { subtle?: boolean }) {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2.5 text-[15px] font-semibold tracking-tight text-foreground"
    >
      <span className="relative inline-flex h-7 w-7 items-center justify-center">
        <span className="absolute inset-0 rounded-lg bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-cyan-400" />
        <span className="absolute inset-[2px] rounded-[6px] bg-surface" />
        <span className="relative z-[1] font-mono text-[11px] font-bold text-foreground">
          ss
        </span>
      </span>
      <span className={subtle ? "text-muted-foreground" : undefined}>
        StyleSync
      </span>
    </Link>
  );
}
