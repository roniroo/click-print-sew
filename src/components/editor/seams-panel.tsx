"use client";

import { useState } from "react";
import { Trash2, Link2 } from "lucide-react";
import type { EdgeRef, PatternDocument } from "@/lib/types";
import { useEditor } from "@/lib/editor/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function edgeLabel(doc: PatternDocument, ref: EdgeRef): string {
  const el = doc.elements.find((e) => e.id === ref.elementId);
  if (!el) return "—";
  const piece = el.pieceId ? doc.pieces.find((p) => p.id === el.pieceId) : null;
  return piece ? piece.name : el.type;
}

export function SeamsPanel() {
  const doc = useEditor((s) => s.doc);
  const seams = doc.seams;
  const tool = useEditor((s) => s.tool);
  const setTool = useEditor((s) => s.setTool);
  const renameSeam = useEditor((s) => s.renameSeam);
  const removeSeam = useEditor((s) => s.removeSeam);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-3 py-2">
        <h3 className="text-sm font-semibold">Seams</h3>
        <Button
          variant={tool === "seam" ? "default" : "secondary"}
          size="sm"
          className="h-7"
          onClick={() => setTool("seam")}
        >
          <Link2 className="size-3.5" /> Match edges
        </Button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-2">
        {seams.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">
            Mark which edges get sewn together. Hit <b>Match edges</b>, then click
            one edge and the edge it joins — matching notches and a number appear
            on both pieces.
          </p>
        ) : null}

        {seams.map((seam) => (
          <div key={seam.id} className="flex items-center gap-2 rounded-lg border border-border bg-card p-2">
            <span
              className="grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white"
              style={{ background: seam.color }}
            >
              {seam.label}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm">
                {edgeLabel(doc, seam.a)} ↔ {edgeLabel(doc, seam.b)}
              </div>
              {editingId === seam.id ? (
                <Input
                  autoFocus
                  defaultValue={seam.label}
                  onBlur={(e) => {
                    renameSeam(seam.id, e.target.value.trim() || seam.label);
                    setEditingId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="mt-1 h-6 px-1 text-xs"
                />
              ) : (
                <button
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setEditingId(seam.id)}
                >
                  Label “{seam.label}” · rename
                </button>
              )}
            </div>
            <button
              onClick={() => removeSeam(seam.id)}
              className="grid size-6 shrink-0 place-items-center rounded text-muted-foreground hover:text-destructive"
              aria-label="Remove seam"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
