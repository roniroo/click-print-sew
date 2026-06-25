"use client";

import { useState } from "react";
import {
  Plus,
  Eye,
  EyeOff,
  Lock,
  LockOpen,
  ChevronUp,
  ChevronDown,
  Trash2,
} from "lucide-react";
import { useEditor } from "@/lib/editor/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function LayersPanel() {
  const layers = useEditor((s) => s.doc.layers);
  const elements = useEditor((s) => s.doc.elements);
  const activeLayerId = useEditor((s) => s.activeLayerId);
  const setActiveLayer = useEditor((s) => s.setActiveLayer);
  const addLayer = useEditor((s) => s.addLayer);
  const renameLayer = useEditor((s) => s.renameLayer);
  const toggleVisible = useEditor((s) => s.toggleLayerVisible);
  const toggleLock = useEditor((s) => s.toggleLayerLock);
  const deleteLayer = useEditor((s) => s.deleteLayer);
  const moveLayer = useEditor((s) => s.moveLayer);

  const [editingId, setEditingId] = useState<string | null>(null);

  const ordered = [...layers].reverse(); // top of stack first

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-3 py-2">
        <h3 className="text-sm font-semibold">Layers</h3>
        <Button variant="ghost" size="icon" className="size-7" onClick={addLayer} aria-label="Add layer">
          <Plus className="size-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {ordered.map((layer) => {
          const count = elements.filter((e) => e.layerId === layer.id).length;
          const active = layer.id === activeLayerId;
          return (
            <div
              key={layer.id}
              className={cn(
                "group flex items-center gap-1 rounded-md px-1.5 py-1 text-sm",
                active ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted",
              )}
            >
              <button
                onClick={() => toggleVisible(layer.id)}
                className="text-muted-foreground hover:text-foreground"
                aria-label={layer.visible ? "Hide layer" : "Show layer"}
              >
                {layer.visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
              </button>
              <button
                onClick={() => toggleLock(layer.id)}
                className="text-muted-foreground hover:text-foreground"
                aria-label={layer.locked ? "Unlock layer" : "Lock layer"}
              >
                {layer.locked ? <Lock className="size-4" /> : <LockOpen className="size-4 opacity-40" />}
              </button>

              {editingId === layer.id ? (
                <Input
                  autoFocus
                  defaultValue={layer.name}
                  onBlur={(e) => {
                    renameLayer(layer.id, e.target.value.trim() || layer.name);
                    setEditingId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="h-6 flex-1 px-1 py-0 text-sm"
                />
              ) : (
                <button
                  className="flex-1 truncate text-left"
                  onClick={() => setActiveLayer(layer.id)}
                  onDoubleClick={() => setEditingId(layer.id)}
                  title="Double-click to rename"
                >
                  {layer.name}
                  <span className="ml-1 text-xs text-muted-foreground">({count})</span>
                </button>
              )}

              <div className="flex items-center opacity-0 transition group-hover:opacity-100">
                <button
                  onClick={() => moveLayer(layer.id, 1)}
                  className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-background hover:text-foreground"
                  aria-label="Move up"
                >
                  <ChevronUp className="size-3.5" />
                </button>
                <button
                  onClick={() => moveLayer(layer.id, -1)}
                  className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-background hover:text-foreground"
                  aria-label="Move down"
                >
                  <ChevronDown className="size-3.5" />
                </button>
                {layers.length > 1 ? (
                  <button
                    onClick={() => deleteLayer(layer.id)}
                    className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-background hover:text-destructive"
                    aria-label="Delete layer"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
