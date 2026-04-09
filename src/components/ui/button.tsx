import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * App-chrome button. Separate from the preview-grid <PreviewButton>
 * deliberately — this one lives in the dashboard and consumes the --app-*
 * tokens. The preview button consumes --color-primary etc. and is rendered
 * inside a `.preview-scope`. Mixing them would mean the dashboard itself
 * re-skinned whenever you edited tokens, which is the opposite of what the
 * product does.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm hover:shadow-md active:scale-[0.98]",
        secondary:
          "bg-surface-raised text-foreground border border-border hover:bg-muted active:scale-[0.98]",
        ghost:
          "text-foreground hover:bg-muted active:scale-[0.98]",
        danger:
          "bg-danger text-white hover:bg-danger/90 shadow-sm active:scale-[0.98]",
        outline:
          "border border-border text-foreground hover:bg-muted active:scale-[0.98]",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4",
        lg: "h-11 px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
