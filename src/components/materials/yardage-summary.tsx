"use client";

import { useEditor } from "@/lib/editor/store";
import { estimateYardage } from "@/lib/materials/yardage";

/** Live yardage estimate. Reads the editor document from the store. */
export function YardageSummary() {
  const doc = useEditor((s) => s.doc);
  const { fabrics, unassignedPieceNames } = estimateYardage(doc);

  if (fabrics.length === 0 && unassignedPieceNames.length === 0) {
    return null;
  }

  return (
    <section className="space-y-2 border-t border-border pt-3">
      <h3 className="text-sm font-semibold">Estimated yardage</h3>
      {fabrics.map((f) => (
        <div key={f.fabricId} className="flex items-center gap-2 rounded-md bg-muted px-2 py-1.5 text-sm">
          <span className="size-3 shrink-0 rounded-full" style={{ background: f.color }} />
          <span className="flex-1 truncate">{f.fabricName}</span>
          <span className="font-medium tabular-nums">
            {f.lengthYards.toFixed(2)} yd
            <span className="ml-1 text-xs text-muted-foreground">({f.lengthMeters.toFixed(2)} m)</span>
          </span>
        </div>
      ))}
      {unassignedPieceNames.length > 0 ? (
        <p className="text-xs text-amber-600">
          No fabric set for: {unassignedPieceNames.join(", ")}
        </p>
      ) : null}
      <p className="text-[11px] text-muted-foreground">
        Rough estimate from piece bounding boxes + seam allowance, packed across
        each fabric&apos;s usable width.
      </p>
    </section>
  );
}
