import type { Unit } from "@/lib/types";
import { toMm } from "@/lib/editor/units";

export interface TilingOptions {
  /** Content size in document units. */
  contentWUnits: number;
  contentHUnits: number;
  units: Unit;
  /** Paper size in mm, already oriented (width × height). */
  paperWmm: number;
  paperHmm: number;
  /** Non-printable margin on every edge, mm. */
  marginMm: number;
  /** Overlap between adjacent pages (glue allowance), mm. */
  overlapMm: number;
}

export interface TilingPlan {
  cols: number;
  rows: number;
  pageCount: number;
  paperWmm: number;
  paperHmm: number;
  marginMm: number;
  overlapMm: number;
  printableWmm: number;
  printableHmm: number;
  stepXmm: number;
  stepYmm: number;
  contentWmm: number;
  contentHmm: number;
  /** Millimeters per document unit (the physical scale). */
  mmPerUnit: number;
}

/**
 * Work out how many pages are needed to tile the pattern at 1:1 scale, given
 * paper size, printer margins, and a glue overlap between tiles.
 */
export function computeTiling(o: TilingOptions): TilingPlan {
  const mmPerUnit = toMm(1, o.units);
  const contentWmm = Math.max(0, o.contentWUnits) * mmPerUnit;
  const contentHmm = Math.max(0, o.contentHUnits) * mmPerUnit;

  const printableWmm = Math.max(10, o.paperWmm - o.marginMm * 2);
  const printableHmm = Math.max(10, o.paperHmm - o.marginMm * 2);

  // Each successive page advances by (printable − overlap).
  const stepXmm = Math.max(1, printableWmm - o.overlapMm);
  const stepYmm = Math.max(1, printableHmm - o.overlapMm);

  const cols = Math.max(1, Math.ceil((contentWmm - printableWmm) / stepXmm) + 1);
  const rows = Math.max(1, Math.ceil((contentHmm - printableHmm) / stepYmm) + 1);

  return {
    cols,
    rows,
    pageCount: cols * rows,
    paperWmm: o.paperWmm,
    paperHmm: o.paperHmm,
    marginMm: o.marginMm,
    overlapMm: o.overlapMm,
    printableWmm,
    printableHmm,
    stepXmm,
    stepYmm,
    contentWmm,
    contentHmm,
    mmPerUnit,
  };
}

/**
 * Top-left corner (in mm, relative to the content origin) of the content window
 * shown on the page at the given column/row.
 */
export function pageOriginMm(
  plan: TilingPlan,
  col: number,
  row: number,
): { xMm: number; yMm: number } {
  return { xMm: col * plan.stepXmm, yMm: row * plan.stepYmm };
}
