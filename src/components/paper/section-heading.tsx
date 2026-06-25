import * as React from "react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  description?: string;
  /** Optional actions rendered on the right (buttons, links). */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * A page/section header with a handwritten title and an underline that looks
 * hand-drawn. Keeps headings consistent across the app.
 */
export function SectionHeading({
  title,
  description,
  actions,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="space-y-1">
        <h2 className="font-hand text-3xl font-bold leading-none tracking-tight text-foreground">
          {title}
          <span className="mt-1 block h-1.5 w-16 rounded-full bg-thread/70" />
        </h2>
        {description ? (
          <p className="max-w-prose text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
