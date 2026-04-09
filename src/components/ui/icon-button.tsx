import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  active?: boolean;
}

/**
 * Square, icon-only button with a forced tooltip label. Keeping the tooltip
 * mandatory means every icon control in the app has a readable name for
 * screen readers without the caller having to remember to add `aria-label`.
 */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, label, active, children, ...props }, ref) => (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            ref={ref}
            aria-label={label}
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-colors",
              "hover:bg-muted hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active && "border-border bg-muted text-foreground",
              className,
            )}
            {...props}
          >
            {children}
          </button>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
);
IconButton.displayName = "IconButton";
