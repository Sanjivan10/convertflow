import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "success" | "warning" | "muted" | "outline";
};

const styles: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  success:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  warning:
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  muted: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  outline:
    "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}
