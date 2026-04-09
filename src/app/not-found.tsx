import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SiteMark } from "@/components/landing/site-mark";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <SiteMark />
      <h1 className="mt-10 text-6xl font-semibold tracking-tight text-foreground">
        404
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        We couldn't find the page you were looking for.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Back home</Link>
      </Button>
    </div>
  );
}
