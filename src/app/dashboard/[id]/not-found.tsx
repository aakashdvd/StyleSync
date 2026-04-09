import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteMark } from "@/components/landing/site-mark";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <SiteMark />
      <h1 className="mt-10 text-3xl font-semibold tracking-tight text-foreground">
        Site not found
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        That token set doesn't exist — it may have been removed, or the URL is
        wrong.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">
          <ArrowLeft className="size-4" />
          Back to landing
        </Link>
      </Button>
    </div>
  );
}
