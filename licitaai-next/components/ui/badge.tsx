import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        // ── Status pills ──────────────────────────────────────────────────
        ativa:
          "rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 px-3 py-0.5 text-xs font-semibold",
        encerrada:
          "rounded-full bg-slate-500/15 text-slate-400 border border-slate-500/20 px-3 py-0.5 text-xs font-semibold",
        alta:
          "rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/20 px-3 py-0.5 text-xs font-semibold",
        vencendo:
          "rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/20 px-3 py-0.5 text-xs font-semibold",
        critico:
          "rounded-full bg-red-500/15 text-red-300 border border-red-500/20 px-3 py-0.5 text-xs font-semibold",
        valido:
          "rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 px-3 py-0.5 text-xs font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
