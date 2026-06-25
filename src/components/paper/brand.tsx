import Link from "next/link";
import { Scissors } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandProps {
  className?: string;
  /** Render as a plain element instead of a link to home. */
  asLink?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { icon: "size-4", text: "text-xl" },
  md: { icon: "size-5", text: "text-2xl" },
  lg: { icon: "size-7", text: "text-4xl" },
};

export function Brand({ className, asLink = true, size = "md" }: BrandProps) {
  const s = sizes[size];
  const content = (
    <span className={cn("inline-flex items-center gap-2 text-foreground", className)}>
      <span className="grid place-items-center rounded-md bg-primary p-1.5 text-primary-foreground">
        <Scissors className={s.icon} />
      </span>
      <span className={cn("font-hand font-bold leading-none tracking-tight", s.text)}>
        Cut Sew Print
      </span>
    </span>
  );

  if (!asLink) return content;
  return (
    <Link href="/" className="transition-opacity hover:opacity-80">
      {content}
    </Link>
  );
}
