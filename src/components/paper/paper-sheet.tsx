import * as React from "react";
import { cn } from "@/lib/utils";

interface PaperSheetProps extends React.ComponentProps<"div"> {
  /** Surface style: plain paper, dotted graph, square grid, or ruled lines. */
  variant?: "plain" | "graph" | "grid" | "ruled";
  /** Adds a subtle taped/lifted-corner shadow. */
  lifted?: boolean;
}

const variantClass: Record<NonNullable<PaperSheetProps["variant"]>, string> = {
  plain: "bg-card",
  graph: "bg-graph",
  grid: "bg-grid",
  ruled: "bg-ruled",
};

/**
 * A paper-like surface. The visual foundation for the notebook aesthetic —
 * use it to wrap forms, panels, and content areas.
 */
export function PaperSheet({
  variant = "plain",
  lifted = false,
  className,
  children,
  ...props
}: PaperSheetProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border",
        variantClass[variant],
        lifted && "shadow-[0_1px_0_rgba(0,0,0,0.02),0_8px_24px_-12px_rgba(31,41,55,0.25)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
