import type { PatternDocument } from "@/lib/types";
import { elementsBounds } from "@/lib/editor/geometry";
import { toMm } from "@/lib/editor/units";

export interface FabricYardage {
  fabricId: string;
  fabricName: string;
  color: string;
  /** Estimated fabric length needed, in document units. */
  lengthUnits: number;
  lengthYards: number;
  lengthMeters: number;
  pieceCount: number;
}

export interface YardageEstimate {
  fabrics: FabricYardage[];
  /** Names of pieces that have shapes but no fabric assigned. */
  unassignedPieceNames: string[];
}

interface PieceBox {
  w: number;
  h: number;
}

/**
 * Shelf bin-packing (next-fit by decreasing height): lay pieces across the
 * fabric width in rows; total length is the sum of row heights. A rough but
 * reasonable estimate of fabric needed.
 */
function packLength(boxes: PieceBox[], fabricWidth: number): number {
  const items = boxes
    .map((b) => {
      // rotate so the piece fits the width when possible
      if (b.w > fabricWidth && b.h <= fabricWidth) return { w: b.h, h: b.w };
      return b;
    })
    .sort((a, b) => b.h - a.h);

  let total = 0;
  let rowRemaining = 0;
  let rowHeight = 0;
  for (const item of items) {
    if (item.w <= rowRemaining) {
      rowRemaining -= item.w;
      rowHeight = Math.max(rowHeight, item.h);
    } else {
      total += rowHeight;
      rowHeight = item.h;
      rowRemaining = Math.max(0, fabricWidth - item.w);
    }
  }
  total += rowHeight;
  return total;
}

/** Estimate fabric needed per assigned fabric, plus unassigned pieces. */
export function estimateYardage(doc: PatternDocument): YardageEstimate {
  const unit = doc.units;
  const boxesByFabric = new Map<string, PieceBox[]>();
  const countByFabric = new Map<string, number>();
  const unassigned: string[] = [];

  for (const piece of doc.pieces) {
    const els = doc.elements.filter((e) => e.pieceId === piece.id);
    if (els.length === 0) continue;
    const b = elementsBounds(els);
    if (!b) continue;
    const sa = piece.seamAllowance;
    const box: PieceBox = { w: b.w + sa * 2, h: b.h + sa * 2 };

    if (!piece.fabricId) {
      unassigned.push(piece.name);
      continue;
    }
    const list = boxesByFabric.get(piece.fabricId) ?? [];
    list.push(box);
    boxesByFabric.set(piece.fabricId, list);
    countByFabric.set(piece.fabricId, (countByFabric.get(piece.fabricId) ?? 0) + 1);
  }

  const fabrics: FabricYardage[] = [];
  for (const fabric of doc.materials.fabrics) {
    const boxes = boxesByFabric.get(fabric.id);
    if (!boxes || boxes.length === 0) continue;
    const lengthUnits = packLength(boxes, fabric.widthUnits);
    const lengthMm = toMm(lengthUnits, unit);
    fabrics.push({
      fabricId: fabric.id,
      fabricName: fabric.name,
      color: fabric.color,
      lengthUnits,
      lengthYards: lengthMm / 914.4,
      lengthMeters: lengthMm / 1000,
      pieceCount: countByFabric.get(fabric.id) ?? 0,
    });
  }

  return { fabrics, unassignedPieceNames: unassigned };
}
