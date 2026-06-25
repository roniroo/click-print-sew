"use client";

import { Plus, Trash2, Scissors, CircleDot } from "lucide-react";
import { useEditor } from "@/lib/editor/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { YardageSummary } from "@/components/materials/yardage-summary";

export function MaterialsPanel() {
  const fabrics = useEditor((s) => s.doc.materials.fabrics);
  const notions = useEditor((s) => s.doc.materials.notions);
  const units = useEditor((s) => s.doc.units);

  const addFabric = useEditor((s) => s.addFabric);
  const updateFabric = useEditor((s) => s.updateFabric);
  const removeFabric = useEditor((s) => s.removeFabric);
  const addNotion = useEditor((s) => s.addNotion);
  const updateNotion = useEditor((s) => s.updateNotion);
  const removeNotion = useEditor((s) => s.removeNotion);

  return (
    <div className="space-y-4 p-3">
      {/* Fabrics */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <Scissors className="size-4 text-thread" /> Fabrics
          </h3>
          <Button variant="ghost" size="icon" className="size-7" onClick={addFabric} aria-label="Add fabric">
            <Plus className="size-4" />
          </Button>
        </div>
        {fabrics.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Add fabrics, then assign them to pieces to estimate yardage.
          </p>
        ) : null}
        {fabrics.map((f) => (
          <div key={f.id} className="rounded-lg border border-border bg-card p-2">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={f.color}
                onChange={(e) => updateFabric(f.id, { color: e.target.value })}
                className="size-7 shrink-0 cursor-pointer rounded border border-border"
                aria-label="Fabric color"
              />
              <Input
                value={f.name}
                onChange={(e) => updateFabric(f.id, { name: e.target.value })}
                className="h-8"
                aria-label="Fabric name"
              />
              <button
                onClick={() => removeFabric(f.id)}
                className="grid size-7 shrink-0 place-items-center rounded text-muted-foreground hover:text-destructive"
                aria-label="Remove fabric"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
            <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              Usable width
              <Input
                type="number"
                min="1"
                step="1"
                value={f.widthUnits}
                onChange={(e) => updateFabric(f.id, { widthUnits: Math.max(1, Number(e.target.value) || 1) })}
                className="h-7 w-24 px-2"
              />
              {units}
            </label>
          </div>
        ))}
      </section>

      {/* Notions */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <CircleDot className="size-4 text-thread" /> Notions
          </h3>
          <Button variant="ghost" size="icon" className="size-7" onClick={() => addNotion()} aria-label="Add notion">
            <Plus className="size-4" />
          </Button>
        </div>
        {notions.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Buttons, zippers, clasps… add them and drag their pins on the canvas.
          </p>
        ) : null}
        {notions.map((n) => (
          <div key={n.id} className="rounded-lg border border-border bg-card p-2">
            <div className="flex items-center gap-2">
              <Input
                value={n.name}
                onChange={(e) => updateNotion(n.id, { name: e.target.value })}
                className="h-8"
                aria-label="Notion name"
              />
              <Input
                type="number"
                min="1"
                value={n.qty}
                onChange={(e) => updateNotion(n.id, { qty: Math.max(1, Number(e.target.value) || 1) })}
                className="h-8 w-16 px-2"
                aria-label="Quantity"
              />
              <button
                onClick={() => removeNotion(n.id)}
                className="grid size-7 shrink-0 place-items-center rounded text-muted-foreground hover:text-destructive"
                aria-label="Remove notion"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
            <Input
              value={n.note}
              onChange={(e) => updateNotion(n.id, { note: e.target.value })}
              placeholder="Placement note (e.g. center front)"
              className="mt-2 h-8 text-xs"
              aria-label="Placement note"
            />
          </div>
        ))}
      </section>

      <YardageSummary />
    </div>
  );
}
