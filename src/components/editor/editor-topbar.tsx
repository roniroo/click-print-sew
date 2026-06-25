"use client";

import Link from "next/link";
import {
  ChevronLeft,
  Undo2,
  Redo2,
  Printer,
  Check,
  Loader2,
  CloudOff,
  TriangleAlert,
} from "lucide-react";
import { useEditor, type SaveStatus } from "@/lib/editor/store";
import { UNIT_OPTIONS } from "@/lib/constants";
import type { Unit } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function SaveBadge({ status }: { status: SaveStatus }) {
  const map = {
    saved: { icon: Check, text: "Saved", cls: "text-emerald-600" },
    saving: { icon: Loader2, text: "Saving…", cls: "text-muted-foreground" },
    unsaved: { icon: CloudOff, text: "Unsaved", cls: "text-amber-600" },
    error: { icon: TriangleAlert, text: "Save failed", cls: "text-destructive" },
  } as const;
  const { icon: Icon, text, cls } = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${cls}`}>
      <Icon className={`size-3.5 ${status === "saving" ? "animate-spin" : ""}`} />
      {text}
    </span>
  );
}

export function EditorTopbar({ onPrint }: { onPrint: () => void }) {
  const title = useEditor((s) => s.title);
  const setTitle = useEditor((s) => s.setTitle);
  const units = useEditor((s) => s.doc.units);
  const setUnits = useEditor((s) => s.setUnits);
  const isPublic = useEditor((s) => s.isPublic);
  const setIsPublic = useEditor((s) => s.setIsPublic);
  const undo = useEditor((s) => s.undo);
  const redo = useEditor((s) => s.redo);
  const canUndo = useEditor((s) => s.past.length > 0);
  const canRedo = useEditor((s) => s.future.length > 0);
  const saveStatus = useEditor((s) => s.saveStatus);

  return (
    <header className="flex h-14 items-center gap-2 border-b border-border bg-card px-3">
      <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
        <Link href="/dashboard">
          <ChevronLeft className="size-4" />
          <span className="hidden sm:inline">Patterns</span>
        </Link>
      </Button>

      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="h-9 max-w-64 border-transparent bg-transparent font-hand text-lg font-semibold shadow-none hover:border-border focus-visible:border-border"
        aria-label="Pattern title"
      />

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden items-center gap-1.5 sm:flex">
          <Label htmlFor="units" className="text-xs text-muted-foreground">
            Units
          </Label>
          <Select value={units} onValueChange={(v) => setUnits(v as Unit)}>
            <SelectTrigger id="units" size="sm" className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNIT_OPTIONS.map((u) => (
                <SelectItem key={u.value} value={u.value}>
                  {u.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo} aria-label="Undo">
                <Undo2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo ⌘Z</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo} aria-label="Redo">
                <Redo2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo ⇧⌘Z</TooltipContent>
          </Tooltip>
        </div>

        <div className="hidden w-20 justify-end sm:flex">
          <SaveBadge status={saveStatus} />
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <label className="flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted">
              <Switch checked={isPublic} onCheckedChange={setIsPublic} aria-label="Public" />
              <span className="hidden md:inline">Public</span>
            </label>
          </TooltipTrigger>
          <TooltipContent>Share this pattern in Explore</TooltipContent>
        </Tooltip>

        <Button onClick={onPrint} size="sm">
          <Printer className="size-4" />
          <span className="hidden sm:inline">Print</span>
        </Button>
      </div>
    </header>
  );
}
