"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors shadow-sm",
  {
    variants: {
      variant: {
        default: "bg-teal-500/20 text-teal-300 border border-teal-500/30 shadow-[inset_0_0_8px_rgba(13,148,136,0.15)]",
        secondary: "bg-slate-700 text-slate-300 border border-slate-600 shadow-[inset_0_0_8px_rgba(100,116,139,0.15)]",
        destructive: "bg-red-500/20 text-red-300 border border-red-500/30 shadow-[inset_0_0_8px_rgba(239,68,68,0.15)]",
        success: "bg-green-500/20 text-green-300 border border-green-500/30 shadow-[inset_0_0_8px_rgba(34,197,94,0.15)]",
        warning: "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-[inset_0_0_8px_rgba(245,158,11,0.15)]",
        purple: "bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-[inset_0_0_8px_rgba(168,85,247,0.15)]",
        outline: "border border-slate-600 text-slate-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
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
