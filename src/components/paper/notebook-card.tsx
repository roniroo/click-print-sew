import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface NotebookCardProps extends React.ComponentProps<"div"> {
  /** If provided, the whole card becomes a link. */
  href?: string;
  /** Slight random-feeling tilt for a pinned-to-corkboard feel. */
  tilt?: boolean;
}

/**
 * An index-card styled container with a red margin rule down the left edge.
 * Used for pattern tiles, feature callouts, and list items.
 */
export function NotebookCard({
  href,
  tilt = false,
  className,
  children,
  ...props
}: NotebookCardProps) {
  const classes = cn(
    "group relative block overflow-hidden rounded-lg border border-border bg-card",
    "shadow-[0_6px_18px_-14px_rgba(31,41,55,0.45)] transition-all",
    "before:absolute before:inset-y-0 before:left-5 before:w-px before:bg-margin/50 before:content-['']",
    "hover:-translate-y-0.5 hover:shadow-[0_12px_26px_-14px_rgba(31,41,55,0.5)]",
    tilt && "rotate-[-0.6deg] hover:rotate-0",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
