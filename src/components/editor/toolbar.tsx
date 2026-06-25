"use client";

import {
  MousePointer2,
  Slash,
  PenTool,
  Square,
  Circle,
  Hand,
  Magnet,
  Grid3x3,
  type LucideIcon,
} from "lucide-react";
import { useEditor, type Tool } from "@/lib/editor/store";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const TOOLS: { tool: Tool; icon: LucideIcon; label: string; key: string }[] = [
  { tool: "select", icon: MousePointer2, label: "Select / move", key: "V" },
  { tool: "line", icon: Slash, label: "Line", key: "L" },
  { tool: "polyline", icon: PenTool, label: "Path (click points, Enter to finish)", key: "P" },
  { tool: "rect", icon: Square, label: "Rectangle", key: "R" },
  { tool: "ellipse", icon: Circle, label: "Ellipse", key: "E" },
  { tool: "pan", icon: Hand, label: "Pan (or hold Space)", key: "H" },
];

function RailButton({
  active,
  label,
  hint,
  onClick,
  children,
}: {
  active?: boolean;
  label: string;
  hint?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={active ? "default" : "ghost"}
          size="icon"
          onClick={onClick}
          className={cn("size-10", !active && "text-muted-foreground")}
          aria-label={label}
          aria-pressed={active}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">
        {label}
        {hint ? <span className="ml-1 opacity-60">{hint}</span> : null}
      </TooltipContent>
    </Tooltip>
  );
}

export function Toolbar() {
  const tool = useEditor((s) => s.tool);
  const setTool = useEditor((s) => s.setTool);
  const snapEnabled = useEditor((s) => s.snapEnabled);
  const toggleSnap = useEditor((s) => s.toggleSnap);
  const gridVisible = useEditor((s) => s.gridVisible);
  const setGridVisible = useEditor((s) => s.setGridVisible);

  return (
    <div className="flex w-14 flex-col items-center gap-1 border-r border-border bg-card py-2">
      {TOOLS.map((t) => (
        <RailButton
          key={t.tool}
          active={tool === t.tool}
          label={t.label}
          hint={t.key}
          onClick={() => setTool(t.tool)}
        >
          <t.icon className="size-5" />
        </RailButton>
      ))}

      <Separator className="my-1 w-8" />

      <RailButton
        active={snapEnabled}
        label="Snap to grid"
        hint="when off, free placement"
        onClick={toggleSnap}
      >
        <Magnet className="size-5" />
      </RailButton>
      <RailButton
        active={gridVisible}
        label="Show grid"
        onClick={() => setGridVisible(!gridVisible)}
      >
        <Grid3x3 className="size-5" />
      </RailButton>
    </div>
  );
}
