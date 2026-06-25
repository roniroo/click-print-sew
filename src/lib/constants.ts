import type { Unit } from "@/lib/types";

/** Conversion factor: how many millimeters in one of each unit. */
export const MM_PER_UNIT: Record<Unit, number> = {
  mm: 1,
  cm: 10,
  m: 1000,
  in: 25.4,
  ft: 304.8,
};

export const UNIT_OPTIONS: { value: Unit; label: string; abbr: string }[] = [
  { value: "in", label: "Inches", abbr: "in" },
  { value: "cm", label: "Centimeters", abbr: "cm" },
  { value: "mm", label: "Millimeters", abbr: "mm" },
  { value: "m", label: "Meters", abbr: "m" },
  { value: "ft", label: "Feet", abbr: "ft" },
];

/** Sensible default grid spacing for each unit (in that unit). */
export const DEFAULT_GRID_SIZE: Record<Unit, number> = {
  in: 0.5,
  cm: 1,
  mm: 10,
  m: 0.1,
  ft: 0.25,
};

export interface PaperSize {
  id: string;
  label: string;
  /** Portrait dimensions in millimeters. */
  widthMm: number;
  heightMm: number;
}

export const PAPER_SIZES: PaperSize[] = [
  { id: "letter", label: 'Letter (8.5" × 11")', widthMm: 215.9, heightMm: 279.4 },
  { id: "legal", label: 'Legal (8.5" × 14")', widthMm: 215.9, heightMm: 355.6 },
  { id: "tabloid", label: 'Tabloid (11" × 17")', widthMm: 279.4, heightMm: 431.8 },
  { id: "a4", label: "A4 (210 × 297 mm)", widthMm: 210, heightMm: 297 },
  { id: "a3", label: "A3 (297 × 420 mm)", widthMm: 297, heightMm: 420 },
  { id: "a5", label: "A5 (148 × 210 mm)", widthMm: 148, heightMm: 210 },
];

/** Points per inch — the unit jsPDF works in. */
export const PT_PER_INCH = 72;
export const PT_PER_MM = PT_PER_INCH / 25.4;

export const DEFAULT_STROKE = "#1f2937"; // ink
export const DEFAULT_STROKE_WIDTH = 2; // screen px at 100% zoom
export const DEFAULT_FILL = "none";

/** A pleasant palette for distinguishing pattern pieces / fabrics. */
export const PIECE_COLORS = [
  "#b91c1c",
  "#c2410c",
  "#a16207",
  "#15803d",
  "#0f766e",
  "#1d4ed8",
  "#6d28d9",
  "#be185d",
];
