"use client";

import { Trash2 } from "lucide-react";
import type { Element } from "@/lib/types";
import { useEditor } from "@/lib/editor/store";
import { elementBounds, elementLength } from "@/lib/editor/geometry";
import { formatLength, roundForDisplay } from "@/lib/editor/units";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function NumField({
  label,
  value,
  onCommit,
  step = 0.1,
  suffix,
}: {
  label: string;
  value: number;
  onCommit: (v: number) => void;
  step?: number;
  suffix?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <Input
          key={`${label}:${roundForDisplay(value, 3)}`}
          type="number"
          step={step}
          defaultValue={roundForDisplay(value, 3)}
          onBlur={(e) => onCommit(Number(e.target.value) || 0)}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          className="h-8 px-2"
        />
        {suffix ? <span className="text-[11px] text-muted-foreground">{suffix}</span> : null}
      </div>
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-2">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      <input
        type="color"
        value={value === "none" ? "#000000" : value}
        onChange={(e) => onChange(e.target.value)}
        className="size-7 cursor-pointer rounded border border-border bg-transparent"
        aria-label={label}
      />
    </label>
  );
}

function StyleFields({ el }: { el: Element }) {
  const updateElement = useEditor((s) => s.updateElement);
  const canFill = el.type === "rect" || el.type === "ellipse" || (el.type === "polyline" && el.closed);
  return (
    <div className="space-y-2 border-t border-border pt-3">
      <ColorField label="Stroke" value={el.stroke} onChange={(v) => updateElement(el.id, { stroke: v })} />
      <NumField
        label="Stroke width"
        value={el.strokeWidth}
        step={0.5}
        suffix="px"
        onCommit={(v) => updateElement(el.id, { strokeWidth: Math.max(0.25, v) })}
      />
      {canFill ? (
        <label className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium text-muted-foreground">Fill</span>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={el.fill !== "none"}
              onChange={(e) => updateElement(el.id, { fill: e.target.checked ? "#dbeafe" : "none" })}
            />
            {el.fill !== "none" ? (
              <input
                type="color"
                value={el.fill}
                onChange={(e) => updateElement(el.id, { fill: e.target.value })}
                className="size-7 cursor-pointer rounded border border-border bg-transparent"
                aria-label="Fill color"
              />
            ) : null}
          </div>
        </label>
      ) : null}
    </div>
  );
}

function ElementInspector({ el }: { el: Element }) {
  const units = useEditor((s) => s.doc.units);
  const updateElement = useEditor((s) => s.updateElement);
  const deleteSelected = useEditor((s) => s.deleteSelected);
  const b = elementBounds(el);

  return (
    <div className="space-y-3 p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold capitalize">{el.type}</h3>
        <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-destructive" onClick={deleteSelected} aria-label="Delete">
          <Trash2 className="size-4" />
        </Button>
      </div>

      {el.type === "line" ? (
        <div className="grid grid-cols-2 gap-2">
          <NumField label="X1" value={el.points[0].x} onCommit={(v) => updateElement(el.id, { points: [{ ...el.points[0], x: v }, el.points[1]] })} />
          <NumField label="Y1" value={el.points[0].y} onCommit={(v) => updateElement(el.id, { points: [{ ...el.points[0], y: v }, el.points[1]] })} />
          <NumField label="X2" value={el.points[1].x} onCommit={(v) => updateElement(el.id, { points: [el.points[0], { ...el.points[1], x: v }] })} />
          <NumField label="Y2" value={el.points[1].y} onCommit={(v) => updateElement(el.id, { points: [el.points[0], { ...el.points[1], y: v }] })} />
        </div>
      ) : null}

      {el.type === "rect" ? (
        <div className="grid grid-cols-2 gap-2">
          <NumField label="X" value={el.x} onCommit={(v) => updateElement(el.id, { x: v })} />
          <NumField label="Y" value={el.y} onCommit={(v) => updateElement(el.id, { y: v })} />
          <NumField label="Width" value={el.w} onCommit={(v) => updateElement(el.id, { w: v })} />
          <NumField label="Height" value={el.h} onCommit={(v) => updateElement(el.id, { h: v })} />
        </div>
      ) : null}

      {el.type === "ellipse" ? (
        <div className="grid grid-cols-2 gap-2">
          <NumField label="Center X" value={el.cx} onCommit={(v) => updateElement(el.id, { cx: v })} />
          <NumField label="Center Y" value={el.cy} onCommit={(v) => updateElement(el.id, { cy: v })} />
          <NumField label="Radius X" value={el.rx} onCommit={(v) => updateElement(el.id, { rx: Math.max(0, v) })} />
          <NumField label="Radius Y" value={el.ry} onCommit={(v) => updateElement(el.id, { ry: Math.max(0, v) })} />
        </div>
      ) : null}

      {el.type === "polyline" ? (
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>{el.points.length} points</span>
            <label className="flex items-center gap-1.5 text-foreground">
              <input
                type="checkbox"
                checked={el.closed}
                onChange={(e) => updateElement(el.id, { closed: e.target.checked })}
              />
              Closed
            </label>
          </div>
          <div className="flex justify-between">
            <span>Width</span>
            <span className="text-foreground">{formatLength(b.w, units)}</span>
          </div>
          <div className="flex justify-between">
            <span>Height</span>
            <span className="text-foreground">{formatLength(b.h, units)}</span>
          </div>
        </div>
      ) : null}

      <div className="flex justify-between rounded-md bg-muted px-2 py-1.5 text-xs">
        <span className="text-muted-foreground">
          {el.type === "rect" || el.type === "ellipse" || (el.type === "polyline" && el.closed)
            ? "Perimeter"
            : "Length"}
        </span>
        <span className="font-medium tabular-nums">{formatLength(elementLength(el), units)}</span>
      </div>

      <StyleFields el={el} />
    </div>
  );
}

function CanvasInspector() {
  const canvas = useEditor((s) => s.doc.canvas);
  const units = useEditor((s) => s.doc.units);
  const setCanvasSize = useEditor((s) => s.setCanvasSize);
  const setGridSize = useEditor((s) => s.setGridSize);

  return (
    <div className="space-y-3 p-3">
      <h3 className="text-sm font-semibold">Canvas</h3>
      <p className="text-xs text-muted-foreground">
        Nothing selected. Click a shape to edit it, or adjust the working sheet.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <NumField label="Width" value={canvas.widthUnits} suffix={units} onCommit={(v) => setCanvasSize(v, canvas.heightUnits)} />
        <NumField label="Height" value={canvas.heightUnits} suffix={units} onCommit={(v) => setCanvasSize(canvas.widthUnits, v)} />
      </div>
      <NumField label="Grid size" value={canvas.gridSizeUnits} step={0.05} suffix={units} onCommit={(v) => setGridSize(v)} />
    </div>
  );
}

export function Inspector() {
  const selectedIds = useEditor((s) => s.selectedIds);
  const elements = useEditor((s) => s.doc.elements);
  const deleteSelected = useEditor((s) => s.deleteSelected);

  if (selectedIds.length === 1) {
    const el = elements.find((e) => e.id === selectedIds[0]);
    if (el) return <ElementInspector el={el} />;
  }

  if (selectedIds.length > 1) {
    return (
      <div className="space-y-3 p-3">
        <h3 className="text-sm font-semibold">{selectedIds.length} shapes selected</h3>
        <Button variant="outline" size="sm" className="w-full text-destructive" onClick={deleteSelected}>
          <Trash2 className="size-4" /> Delete selection
        </Button>
        <p className="text-xs text-muted-foreground">
          Drag to move them together. Hold Shift while dragging to lock to an axis.
        </p>
      </div>
    );
  }

  return <CanvasInspector />;
}
